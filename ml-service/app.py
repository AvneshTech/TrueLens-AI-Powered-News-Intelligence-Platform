from flask import Flask, request, jsonify
import pickle
import os
from utils import clean_text

app = Flask(__name__)

# ─── Load model & vectorizer ───────────────────────────────────────────────────
BASE_DIR = os.path.dirname(os.path.abspath(__file__))

try:
    model = pickle.load(open(os.path.join(BASE_DIR, "model.pkl"), "rb"))
    vectorizer = pickle.load(open(os.path.join(BASE_DIR, "vectorizer.pkl"), "rb"))
    print("✅ Model and vectorizer loaded successfully")
    print("📊 Model classes:", model.classes_)  # DEBUG
except FileNotFoundError as e:
    raise RuntimeError(
        f"Model files not found: {e}\n"
        "Please run train.py first to generate model.pkl and vectorizer.pkl"
    )

# ─── CORS ──────────────────────────────────────────────────────────────────────
@app.after_request
def add_cors_headers(response):
    response.headers["Access-Control-Allow-Origin"] = "*"
    response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
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

    # 🧪 Debug logs (VERY IMPORTANT)
    print("\n🔍 DEBUG INFO")
    print("Input:", text[:100])
    print("Cleaned:", cleaned[:100])
    print("Classes:", classes)
    print("Probabilities:", probs)
    print("Mapped:", class_prob_map)
    print("Prediction:", prediction)
    print("Confidence:", confidence)
    print("────────────────────────")

    return jsonify({
        "prediction": prediction,
        "confidence": round(confidence, 4)
    })

# ─── Entry point ──────────────────────────────────────────────────────────────
if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5000))
    app.run(debug=True, port=port, host="0.0.0.0")