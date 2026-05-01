import os, traceback, requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)

CORS(app, origins=[
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://thequietlistener.org"
])

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
MODEL = os.getenv("OLLAMA_MODEL", "phi3:3.8b-mini-instruct")

SYSTEM_PROMPT = (
    "You are The Quiet Listener — warm, human, calm, and emotionally present. "
    "Do not sound robotic or repetitive. Do not always use the same structure. "
    "Sometimes reflect, sometimes validate, sometimes gently notice a feeling. "
    "Avoid advice, diagnoses, judgment, motivational speeches, or generic phrases. "
    "Reply naturally like a thoughtful person listening closely. "
    "Keep it short: 1 to 3 sentences. "
    "Ask at most one gentle open question, but not every reply must end with a question."
)

@app.get("/")
def root():
    return {
        "ok": True,
        "service": "Quiet Listener API",
        "endpoints": ["/health", "/api/reply"]
    }

@app.get("/health")
def health():
    ok_ollama = False
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=3)
        ok_ollama = (r.status_code == 200)
    except Exception:
        ok_ollama = False

    return jsonify({
        "ok": True,
        "ollama": ok_ollama,
        "model": MODEL
    })

@app.post("/api/reply")
def reply():
    data = request.get_json(silent=True) or {}
    user_text = (data.get("message") or "").strip()

    if not user_text:
        return jsonify({"error": "empty_message"}), 400

    prompt = (
        f"{SYSTEM_PROMPT}\n\n"
        f"User message:\n\"\"\"\n{user_text}\n\"\"\"\n\n"
        "Respond naturally in 1–3 short sentences. Avoid repeating the user's exact words. "
        "Only ask a question if it feels helpful."
    )

    try:
        resp = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.65,
                    "num_predict": 180,
                    "repeat_penalty": 1.18
                }
            },
            timeout=60,
        )

        resp.raise_for_status()
        out = resp.json()
        text = (out.get("response") or "").strip()

        if not text:
            raise ValueError("empty response from model")

        return jsonify({"reply": text})

    except Exception:
        traceback.print_exc()
        fallback = (
            "I’m here with you. Something isn’t connecting on my side, "
            "but you can still keep talking. What feels heaviest right now?"
        )
        return jsonify({
            "reply": fallback,
            "warning": "ollama_unavailable"
        }), 200

if __name__ == "__main__":
    with app.app_context():
        print("Routes:", [str(r) for r in app.url_map.iter_rules()])

    app.run(host="127.0.0.1", port=5000, debug=True)