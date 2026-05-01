import React, { useState, useRef } from "react";
import { Send } from "lucide-react";

const API_URL = import.meta.env.VITE_API_URL;

type Msg = { id: string; role: "user" | "listener"; content: string; ts: number };

// AI reply function
async function makeListenerReply(userText: string): Promise<string> {
  try {
    const res = await fetch(`${API_URL}/api/reply`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: userText }),
    });
    if (!res.ok) return "I'm here, listening, but I couldn’t reach the AI.";
    const data = await res.json();
    return data.reply || "I'm here, listening.";
  } catch {
    return "I'm here, even if the connection failed.";
  }
}

export default function App() {
  const [started, setStarted] = useState(false);
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);

  const canSend = input.trim().length > 0 && !sending;

  async function handleSend() {
    if (!canSend) return;
    const text = input.trim();
    setInput("");

    const now = Date.now();
    setMessages((m) => [
      ...m,
      { id: `u-${now}`, role: "user", content: text, ts: now },
    ]);
    setSending(true);

    const replyText = await makeListenerReply(text);
    setMessages((m) => [
      ...m,
      { id: `b-${Date.now()}`, role: "listener", content: replyText, ts: Date.now() },
    ]);

    setSending(false);
    textAreaRef.current?.focus();
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  // --- Intro Page ---
  if (!started) {
    return (
      <div className="flex flex-col items-center justify-center h-screen px-6 text-center bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100">
        <h1 className="text-3xl font-semibold mb-4">The Quiet Listener</h1>
        <p className="max-w-lg text-zinc-500 dark:text-zinc-400 mb-8 leading-relaxed">
          This space is for quiet reflection.
          Speak freely, without judgment or interruption.
          Your words stay private.
          The Quiet Listener responds calmly and empathetically — never to diagnose, only to help you think aloud.
        </p>

        {/* Optional donation button */}
        <div className="mb-8">
          <p className="text-sm text-zinc-500 dark:text-zinc-400 mb-3 italic">
            “If this space has given you a little peace, you can help keep the quiet alive.”
          </p>

          <a
            href="https://www.buymeacoffee.com/georgelouka"
            target="_blank"
            rel="noopener noreferrer"
            className="px-6 py-2 rounded-2xl bg-amber-500 text-white hover:bg-amber-600 transition"
          >
            ☕ Buy me a coffee
          </a>

          <p className="text-xs text-zinc-500 mt-3">
            Donations are optional and go only toward hosting and maintenance costs.
          </p>
        </div>

        <button
          onClick={() => setStarted(true)}
          className="px-6 py-3 text-base font-medium rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition"
        >
          Proceed to Chat
        </button>
      </div>
    );
  }

  // --- Chat Page ---
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-900 text-zinc-900 dark:text-zinc-50">
      <main className="flex-1 overflow-y-auto p-6 max-w-3xl mx-auto w-full">
        {messages.length === 0 ? (
          <p className="text-center text-zinc-500 mt-20">
            Begin typing below to start your conversation.
          </p>
        ) : (
          <div className="flex flex-col gap-4">
            {messages.map((msg) => (
              <div
                key={msg.id}
                className={`${
                  msg.role === "user"
                    ? "self-end bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                    : "self-start bg-zinc-200 text-zinc-900 dark:bg-zinc-800 dark:text-zinc-100"
                } max-w-[80%] p-3 rounded-2xl whitespace-pre-line`}
              >
                {msg.content}
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Input area */}
      <div className="sticky bottom-0 left-0 right-0 border-t border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-black/60 backdrop-blur">
        <div className="max-w-3xl mx-auto p-4 flex items-end gap-3">
          <textarea
            ref={textAreaRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            rows={2}
            placeholder="Type what’s on your mind… (Shift+Enter for newline)"
            className="flex-1 resize-none rounded-2xl bg-transparent outline-none border border-zinc-300 dark:border-zinc-700 p-3 text-sm leading-6 placeholder:text-zinc-400"
          />
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`rounded-2xl px-4 py-2 text-sm font-medium transition ${
              canSend
                ? "bg-zinc-900 text-white hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                : "bg-zinc-200 text-zinc-400 dark:bg-zinc-800 dark:text-zinc-500 cursor-not-allowed"
            }`}
          >
            {sending ? "..." : <Send className="w-4 h-4" />}
          </button>
        </div>

        <p className="text-[11px] text-center pb-2 text-zinc-500 dark:text-zinc-400">
          This is not therapy or crisis support. If you’re in danger, contact local emergency services.
        </p>

        <p className="text-xs text-center text-zinc-500 mt-4 pb-3">
          <a
            href="/support"
            className="underline hover:text-zinc-700 dark:hover:text-zinc-300"
          >
            Support this project
          </a>
        </p>
      </div>
    </div>
  );
}
