import os, traceback, requests
from flask import Flask, request, jsonify
from flask_cors import CORS

app = Flask(__name__)
CORS(app, origins=["https://thequietlistener.vercel.app"])

OLLAMA_URL = os.getenv("OLLAMA_URL", "http://127.0.0.1:11434")
MODEL = os.getenv("OLLAMA_MODEL", "phi3:3.8b-mini-instruct")

SYSTEM_PROMPT = (
    "You are The Quiet Listener—calm, empathetic, and non-judgmental. "
    "Reflect what the person says and ask one gentle, open question. "
    "Avoid advice, diagnoses, or judgment. Keep replies concise."
)

@app.get("/")
def root():
    return {"ok": True, "service": "Quiet Listener API", "endpoints": ["/health","/api/reply"]}

@app.get("/health")
def health():
    try:
        r = requests.get(f"{OLLAMA_URL}/api/tags", timeout=3)
        ok = (r.status_code == 200)
    except Exception:
        ok = False
    return jsonify({"ok": True, "ollama": ok, "model": MODEL})

@app.post("/api/reply")
def reply():
    data = request.get_json(silent=True) or {}
    user_text = (data.get("message") or "").strip()
    if not user_text:
        return jsonify({"error": "empty_message"}), 400

    prompt = (
        f"{SYSTEM_PROMPT}\n\nUser message:\n\"\"\"\n{user_text}\n\"\"\"\n\n"
        "Respond empathetically in 1–3 short sentences and end with ONE open question."
    )
    try:
        resp = requests.post(
            f"{OLLAMA_URL}/api/generate",
            json={"model": MODEL, "prompt": prompt, "stream": False,
                  "options": {"temperature": 0.8, "num_predict": 256}},
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
        return jsonify({
          "reply": "I’m here, listening. What feels most important about this right now?",
          "warning": "ollama_unavailable"
        }), 200

if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000)
