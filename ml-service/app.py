from flask import Flask, request, jsonify
import pickle
import os
import logging
import time
from collections import defaultdict

from utils import clean_text
from extractors import (
    extract_text_from_url,
    extract_text_from_file,
    domain_credibility_hint,
    ExtractionError,
)

app = Flask(__name__)

# ─── Logging (replaces raw print statements — see Fix #14) ────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── FIX #5b: Simple in-process rate limiter for /predict ────────────────────
# 20 requests per minute per IP. For multi-instance deploys use Redis instead.
_rate_store = defaultdict(list)
RATE_LIMIT = 20
RATE_WINDOW = 60  # seconds

# PHASE 6: URL/file analysis does real outbound I/O (network fetch, parsing) so it
# gets its own, tighter bucket — a burst of large-file uploads shouldn't be able to
# starve the lightweight /predict/text path, and vice versa.
HEAVY_RATE_LIMIT = 10
_heavy_rate_store = defaultdict(list)


def _is_rate_limited(store: dict, ip: str, limit: int) -> bool:
    now = time.time()
    timestamps = [t for t in store[ip] if now - t < RATE_WINDOW]
    store[ip] = timestamps
    if len(timestamps) >= limit:
        return True
    store[ip].append(now)
    return False


def is_rate_limited(ip: str) -> bool:
    return _is_rate_limited(_rate_store, ip, RATE_LIMIT)


def is_heavy_rate_limited(ip: str) -> bool:
    return _is_rate_limited(_heavy_rate_store, ip, HEAVY_RATE_LIMIT)


def get_client_ip() -> str:
    return request.headers.get("X-Forwarded-For", request.remote_addr).split(",")[0].strip()


# ─── Load model & vectorizer ───────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

try:
    model = pickle.load(open(os.path.join(BASE_DIR, "model.pkl"), "rb"))
    vectorizer = pickle.load(open(os.path.join(BASE_DIR, "vectorizer.pkl"), "rb"))
    # FIX #14: Replaced print() with logger. Raw print() cannot be level-filtered,
    # so debug output leaked to stdout in production, potentially exposing user data.
    logger.info("Model and vectorizer loaded successfully")
    logger.debug("Model classes: %s", model.classes_)
except FileNotFoundError as e:
    raise RuntimeError(
        f"Model files not found: {e}\n"
        "Please run train.py first to generate model.pkl and vectorizer.pkl"
    )

# FIX M-4: the old `class_prob_map.get(1, 0) or class_prob_map.get("REAL", 0) or ...`
# chain treated a legitimate 0.0 probability as falsy and silently fell through to
# the next key — meaning any article the model was 100% confident was FAKE (real_prob
# exactly 0.0) got its real_prob "corrected" away from 0. The training labels are
# fixed (see train.py: fake=0, real=1), so look them up explicitly and only fall back
# to the string variants for older/alternate model artifacts, with no `or`-chaining.
def _explicit_prob(class_prob_map: dict, *keys, default: float = 0.0) -> float:
    for key in keys:
        if key in class_prob_map:
            return class_prob_map[key]
    return default


def run_prediction(text: str) -> dict:
    """Core ML pipeline shared by every /predict* route: clean -> vectorize -> predict."""
    cleaned = clean_text(text)
    vector = vectorizer.transform([cleaned])

    probs = model.predict_proba(vector)[0]
    classes = model.classes_
    class_prob_map = dict(zip(classes, probs))

    real_prob = _explicit_prob(class_prob_map, 1, "REAL", "Real")
    fake_prob = _explicit_prob(class_prob_map, 0, "FAKE", "Fake")

    if abs(real_prob - fake_prob) < 0.1:
        prediction = "Uncertain"
    else:
        prediction = "Real" if real_prob > fake_prob else "Fake"

    confidence = max(real_prob, fake_prob)

    logger.debug("Input (first 100 chars): %s", text[:100])
    logger.debug("Cleaned: %s", cleaned[:100])
    logger.debug(
        "Classes: %s | Probs: %s | Prediction: %s | Confidence: %.4f",
        classes, probs, prediction, confidence,
    )

    return {"prediction": prediction, "confidence": round(confidence, 4)}


def apply_credibility_hint(result: dict, url: str) -> dict:
    """
    PHASE 6: nudges the explanation (never the prediction itself) with a domain
    credibility signal for URL-based analysis. The ML model only ever sees text,
    so this heuristic is surfaced as extra context rather than altering the verdict.
    """
    hint = domain_credibility_hint(url)
    if hint == "low":
        result["domainHint"] = "low_credibility"
        result["explanation"] = (
            "This domain is known for satire or low-credibility content. "
            "Treat the ML result with extra caution."
        )
    elif hint == "high":
        result["domainHint"] = "high_credibility"
        result["explanation"] = (
            "This domain is generally recognized as a credible news source."
        )
    return result


MIN_WORDS = 30


def _validate_text(text: str):
    """Returns an error response tuple, or None if the text is valid."""
    if not text or len(text.split()) < MIN_WORDS:
        return jsonify({"error": f"Please provide at least {MIN_WORDS} words"}), 400
    return None


# ─── CORS ──────────────────────────────────────────────────────────────────────
# FIX #4: Was "Access-Control-Allow-Origin: *" — replaced with a specific origin.
# The ML service is called server-to-server by the Java backend, so no browser
# origin is ever legitimate here. ALLOWED_ORIGIN defaults to the backend.
ALLOWED_ORIGIN = os.environ.get("ALLOWED_ORIGIN", "http://localhost:8080")


@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = ALLOWED_ORIGIN
    response.headers["Access-Control-Allow-Methods"] = "POST, OPTIONS"
    response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
    return response


# ─── Routes ────────────────────────────────────────────────────────────────────
@app.route("/")
def home():
    return jsonify({"status": "ok", "message": "TrueLens ML Service is running"})


@app.route("/health")
def health():
    return jsonify({"status": "ok"})


@app.route("/predict", methods=["POST", "OPTIONS"])
def predict():
    """Kept for backward compatibility — equivalent to /predict/text."""
    return predict_text()


@app.route("/predict/text", methods=["POST", "OPTIONS"])
def predict_text():
    if request.method == "OPTIONS":
        return jsonify({}), 200

    client_ip = get_client_ip()
    if is_rate_limited(client_ip):
        return jsonify({"error": "Too many requests. Please try again later."}), 429

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    text = data.get("text", "").strip()
    error = _validate_text(text)
    if error:
        return error

    return jsonify(run_prediction(text))


@app.route("/predict/url", methods=["POST", "OPTIONS"])
def predict_url():
    """PHASE 6: fetch + extract article text from a URL, then run the same model."""
    if request.method == "OPTIONS":
        return jsonify({}), 200

    client_ip = get_client_ip()
    if is_rate_limited(client_ip) or is_heavy_rate_limited(client_ip):
        return jsonify({"error": "Too many requests. Please try again later."}), 429

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    url = (data.get("url") or "").strip()
    if not url:
        return jsonify({"error": "Please provide a url"}), 400

    try:
        text = extract_text_from_url(url)
    except ExtractionError as e:
        return jsonify({"error": str(e)}), 422

    result = run_prediction(text)
    result = apply_credibility_hint(result, url)
    result["extractedWordCount"] = len(text.split())
    return jsonify(result)


@app.route("/predict/file", methods=["POST", "OPTIONS"])
def predict_file():
    """PHASE 6: accept a multipart file upload, extract text, then run the same model."""
    if request.method == "OPTIONS":
        return jsonify({}), 200

    client_ip = get_client_ip()
    if is_rate_limited(client_ip) or is_heavy_rate_limited(client_ip):
        return jsonify({"error": "Too many requests. Please try again later."}), 429

    if "file" not in request.files:
        return jsonify({"error": "No file uploaded (expected multipart field 'file')"}), 400

    uploaded = request.files["file"]
    if not uploaded.filename:
        return jsonify({"error": "No file selected"}), 400

    file_bytes = uploaded.read()
    if not file_bytes:
        return jsonify({"error": "Uploaded file is empty"}), 400

    try:
        text = extract_text_from_file(uploaded.filename, file_bytes)
    except ExtractionError as e:
        return jsonify({"error": str(e)}), 422

    error = _validate_text(text)
    if error:
        return error

    result = run_prediction(text)
    result["extractedWordCount"] = len(text.split())
    return jsonify(result)


# ─── Entry point ──────────────────────────────────────────────────────────────
# FIX #2: debug=True in production enables the Werkzeug interactive debugger,
# which allows arbitrary code execution. Controlled by FLASK_DEBUG env var now.
# Default is False (safe). Set FLASK_DEBUG=true only in local development.
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(debug=debug_mode, port=port, host="0.0.0.0")
