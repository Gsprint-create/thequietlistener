import os, traceback
from flask import Flask, request, jsonify
from flask_cors import CORS
from openai import OpenAI

app = Flask(__name__)

CORS(app, supports_credentials=False)

ALLOWED_ORIGINS = {
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://thequietlistener.org",
    "https://www.thequietlistener.org",
}

@app.after_request
def after_request(response):
    origin = request.headers.get("Origin")

    if origin in ALLOWED_ORIGINS or (origin and origin.endswith(".vercel.app")):
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
    "Respond with empathy and depth when appropriate. "
    "You can reflect, validate feelings, and gently explore thoughts. "
    "Avoid being repetitive or robotic. "
    "Do not force questions — only ask one if it truly fits. "
    "Match the depth of the user's message. " 
    "If they are brief, stay light. "
    "If they open up, go deeper. "
    "Never give clinical advice or diagnosis."
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
            temperature=0.85,
            max_output_tokens=400,
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