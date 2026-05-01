import os, traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI

app = Flask(__name__)

# --- CORS (Vercel + local + production) ---
CORS(app, resources={
    r"/*": {
        "origins": [
            "http://localhost:5173",
            "http://127.0.0.1:5173",
            "https://thequietlistener.org"
        ],
        "allow_headers": ["Content-Type", "Authorization"],
        "methods": ["GET", "POST", "OPTIONS"]
    }
})

@app.after_request
def after_request(response):
    origin = request.headers.get("Origin")

    if origin and (
        origin == "https://thequietlistener.org"
        or origin.endswith(".vercel.app")
        or origin in ["http://localhost:5173", "http://127.0.0.1:5173"]
    ):
        response.headers["Access-Control-Allow-Origin"] = origin
        response.headers["Vary"] = "Origin"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"

    return response

# --- OpenAI ---
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))
MODEL = os.getenv("OPENAI_MODEL", "gpt-4o-mini")

SYSTEM_PROMPT = (
    "You are The Quiet Listener — calm, human, and emotionally present. "
    "Speak naturally like a real person, not a therapist script. "
    "Do not repeat the same sentence patterns. Avoid starting replies with 'It sounds like' too often. "
    "Sometimes respond with a simple acknowledgment, sometimes reflect briefly, sometimes just stay with the feeling. "
    "Do not overanalyze or assume emotions the user did not clearly express. "
    "Avoid forcing a question — only ask one if it genuinely fits. "
    "Keep replies short (1–3 sentences) and natural."
)

# --- Routes ---
@app.get("/")
def root():
    return {
        "ok": True,
        "service": "Quiet Listener API",
        "endpoints": ["/health", "/api/reply"]
    }

@app.get("/health")
def health():
    return jsonify({
        "ok": True,
        "provider": "openai",
        "model": MODEL,
        "has_api_key": bool(os.getenv("OPENAI_API_KEY"))
    })

@app.post("/api/reply")
def reply():
    data = request.get_json(silent=True) or {}
    user_text = (data.get("message") or "").strip()

    if not user_text:
        return jsonify({"error": "empty_message"}), 400

    try:
        response = client.responses.create(
            model=MODEL,
            instructions=SYSTEM_PROMPT,
            input=user_text,
            temperature=0.75,
            max_output_tokens=160,
        )

        text = (response.output_text or "").strip()

        if not text:
            raise ValueError("empty response from OpenAI")

        return jsonify({"reply": text})

    except Exception:
        traceback.print_exc()
        fallback = (
            "I’m here with you. Something isn’t connecting on my side, "
            "but you can still keep talking."
        )
        return jsonify({
            "reply": fallback,
            "warning": "openai_unavailable"
        }), 200


# --- Run ---
if __name__ == "__main__":
    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port)