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
    "You are The Quiet Listener — calm, human, and emotionally present. "
    "Speak naturally like a real person, not a therapist script. "
    "Do not repeat the same sentence patterns. Avoid starting replies with 'It sounds like' too often. "
    "Sometimes respond with a simple acknowledgment, sometimes reflect briefly, sometimes just stay with the feeling. "
    "Do not overanalyze or assume emotions the user did not clearly express. "
    "Avoid forcing a question — only ask one if it genuinely fits. "
    "Keep replies short (1–3 sentences) and natural."
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
        "Respond in a natural, human way in 1–3 short sentences. "
        "Do not follow a fixed pattern. "
        "Sometimes just acknowledge, sometimes reflect briefly. "
        "Only ask a question occasionally, not every time."
    )

    try:
        resp = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={
                "model": MODEL,
                "prompt": prompt,
                "stream": False,
                "options": {
                    "temperature": 0.75,
                    "top_p": 0.9,
                    "repeat_penalty": 1.2,
                    "num_predict": 160
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

    port = int(os.getenv("PORT", 5000))
    app.run(host="0.0.0.0", port=port)