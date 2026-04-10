from flask import Flask, request, jsonify
import pickle
import os
import logging
import time
from collections import defaultdict
from utils import clean_text

app = Flask(__name__)

# ─── Logging (replaces raw print statements — see Fix #14) ────────────────────
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# ─── FIX #5b: Simple in-process rate limiter for /predict ────────────────────
# 20 requests per minute per IP. For multi-instance deploys use Redis instead.
_rate_store = defaultdict(list)
RATE_LIMIT = 20
RATE_WINDOW = 60  # seconds

def is_rate_limited(ip: str) -> bool:
    now = time.time()
    timestamps = [t for t in _rate_store[ip] if now - t < RATE_WINDOW]
    _rate_store[ip] = timestamps
    if len(timestamps) >= RATE_LIMIT:
        return True
    _rate_store[ip].append(now)
    return False

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
    if request.method == "OPTIONS":
        return jsonify({}), 200

    # FIX #5b: reject over-limit callers
    client_ip = request.headers.get("X-Forwarded-For", request.remote_addr).split(",")[0].strip()
    if is_rate_limited(client_ip):
        return jsonify({"error": "Too many requests. Please try again later."}), 429

    data = request.get_json(silent=True)
    if not data:
        return jsonify({"error": "Invalid JSON body"}), 400

    text = data.get("text", "").strip()

    # 🔒 Better validation (avoid garbage input)
    if not text or len(text.split()) < 30:
        return jsonify({"error": "Please provide at least 30 words"}), 400

    # Clean text
    cleaned = clean_text(text)

    # Vectorize
    vector = vectorizer.transform([cleaned])

    # Predict probabilities
    probs = model.predict_proba(vector)[0]
    classes = model.classes_

    # Map classes safely (fixes ALWAYS FAKE bug)
    class_prob_map = dict(zip(classes, probs))

    real_prob = (
        class_prob_map.get(1, 0)
        or class_prob_map.get("REAL", 0)
        or class_prob_map.get("Real", 0)
    )

    fake_prob = (
        class_prob_map.get(0, 0)
        or class_prob_map.get("FAKE", 0)
        or class_prob_map.get("Fake", 0)
    )

    # Handle uncertain predictions
    if abs(real_prob - fake_prob) < 0.1:
        prediction = "Uncertain"
    else:
        prediction = "Real" if real_prob > fake_prob else "Fake"

    confidence = max(real_prob, fake_prob)

    # FIX #14: Replaced print() debug block with logger.debug() calls.
    # Previously every prediction logged the raw submitted text to stdout,
    # which could contain sensitive user content and cluttered production logs.
    # DEBUG level means these lines are silent unless LOG_LEVEL=DEBUG is set.
    logger.debug("Input (first 100 chars): %s", text[:100])
    logger.debug("Cleaned: %s", cleaned[:100])
    logger.debug("Classes: %s | Probs: %s | Prediction: %s | Confidence: %.4f",
                 classes, probs, prediction, confidence)

    return jsonify({
        "prediction": prediction,
        "confidence": round(confidence, 4)
    })

# ─── Entry point ──────────────────────────────────────────────────────────────
# FIX #2: debug=True in production enables the Werkzeug interactive debugger,
# which allows arbitrary code execution. Controlled by FLASK_DEBUG env var now.
# Default is False (safe). Set FLASK_DEBUG=true only in local development.
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    debug_mode = os.environ.get("FLASK_DEBUG", "false").lower() == "true"
    app.run(debug=debug_mode, port=port, host="0.0.0.0")