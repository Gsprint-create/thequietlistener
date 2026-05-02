import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send,
  Mic,
  Trash2,
  Download,
  Lock,
  Unlock,
  Bot,
  User,
  Moon,
  Sun,
  Sparkles,
} from "lucide-react";

console.log("🚀 USING API:", API_URL);

const API_URL =
  import.meta.env.VITE_API_URL || "https://thequietlistener-production.up.railway.app";

const fmtTime = (d: Date) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

type Msg = {
  id: string;
  role: "user" | "listener";
  content: string;
  ts: number;
};

const LS_KEY = "quiet_listener_session_v1";
const THEME_KEY = "quiet_listener_theme";

async function makeListenerReply(userText: string): Promise<string> {
  try {
    const res = await fetch(`${API_URL}/api/reply`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ message: userText }),
    });

    const data = await res.json();

    if (!res.ok) {
      return "I'm here, listening, but I couldn’t reach the AI.";
    }

    return data.reply || "I'm here, listening.";
  } catch (err) {
    console.error("API connection failed:", err);
    return "I'm here, even if the connection failed.";
  }
}

export default function App() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [incognito, setIncognito] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    typeof window !== "undefined"
      ? ((localStorage.getItem(THEME_KEY) as "light" | "dark") || "dark")
      : "dark"
  );

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  useEffect(() => {
    if (!incognito) {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        try {
          setMessages(JSON.parse(raw));
        } catch {}
      }
    }
  }, [incognito]);

  useEffect(() => {
    if (!incognito) {
      localStorage.setItem(LS_KEY, JSON.stringify(messages));
    }
  }, [messages, incognito]);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem(THEME_KEY, theme);
  }, [theme]);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

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

    const reply = await makeListenerReply(text);

    setMessages((m) => [
      ...m,
      {
        id: `b-${Date.now()}`,
        role: "listener",
        content: reply,
        ts: Date.now(),
      },
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

  function clearSession() {
    setMessages([]);
    localStorage.removeItem(LS_KEY);
  }

  function downloadTxt() {
    const header = `The Quiet Listener — Transcript (${new Date().toLocaleString()})\n\n`;
    const lines = messages
      .map((m) => {
        const who = m.role === "user" ? "You" : "Quiet Listener";
        return `[${fmtTime(new Date(m.ts))}] ${who}: ${m.content}`;
      })
      .join("\n");

    const blob = new Blob([header + lines + "\n"], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");

    a.href = url;
    a.download = `quiet-listener-transcript-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();

    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors">
      <div className="sticky top-0 z-10 backdrop-blur bg-white/60 dark:bg-black/40 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div initial={{ rotate: -8, scale: 0.9 }} animate={{ rotate: 0, scale: 1 }}>
              <Sparkles className="w-5 h-5" />
            </motion.div>
            <div className="font-semibold tracking-tight">The Quiet Listener</div>
          </div>

          <div className="flex items-center gap-2">
            <button onClick={() => setTheme(theme === "dark" ? "light" : "dark")} className="rounded-xl border px-3 py-1.5 text-sm">
              {theme === "dark" ? <Sun className="w-4 h-4 inline mr-1" /> : <Moon className="w-4 h-4 inline mr-1" />}
              {theme === "dark" ? "Light" : "Dark"}
            </button>

            <button onClick={() => setIncognito((v) => !v)} className="rounded-xl border px-3 py-1.5 text-sm">
              {incognito ? <Lock className="w-4 h-4 inline mr-1" /> : <Unlock className="w-4 h-4 inline mr-1" />}
              {incognito ? "Incognito" : "Journal"}
            </button>

            <button onClick={downloadTxt} className="rounded-xl border px-3 py-1.5 text-sm">
              <Download className="w-4 h-4 inline mr-1" />
              Export
            </button>

            <button onClick={clearSession} className="rounded-xl border px-3 py-1.5 text-sm text-red-500">
              <Trash2 className="w-4 h-4 inline mr-1" />
              Clear
            </button>
          </div>
        </div>
      </div>

      {messages.length === 0 && (
        <div className="mx-auto max-w-2xl px-4 pt-10 pb-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">
            Talk freely. No fixing. No judgment.
          </h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            This space listens. Share as much or as little as you want.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Bot className="w-4 h-4" />
            <span>The Quiet Listener responds calmly and privately.</span>
          </div>
        </div>
      )}

      <div className="mx-auto max-w-3xl px-4 pb-40 pt-6">
        <div className="flex flex-col gap-3">
          <AnimatePresence>
            {messages.map((m) => (
              <motion.div
                key={m.id}
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
              >
                <MessageBubble msg={m} />
              </motion.div>
            ))}
          </AnimatePresence>

          {sending && (
            <div className="text-sm text-zinc-500 px-4">Quiet Listener is thinking…</div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 border-t border-zinc-200/70 dark:border-zinc-800/70 bg-white/80 dark:bg-black/60 backdrop-blur">
        <div className="mx-auto max-w-3xl px-4 py-3">
          <div className="rounded-2xl border border-zinc-300/60 dark:border-zinc-700/60 bg-white dark:bg-zinc-900 shadow-sm">
            <div className="p-3">
              <textarea
                ref={textAreaRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                rows={3}
                placeholder="Type what’s on your mind… (Shift+Enter for a new line)"
                className="w-full resize-none bg-transparent outline-none text-sm leading-6 placeholder:text-zinc-400"
              />
            </div>

            <div className="flex items-center justify-between px-3 pb-3">
              <div className="text-xs text-zinc-500">
                {incognito ? "Incognito" : "Journal saved locally"} • Enter to send
              </div>

              <div className="flex items-center gap-2">
                <button disabled className="rounded-xl border px-3 py-1.5 text-sm text-zinc-400 cursor-not-allowed">
                  <Mic className="w-4 h-4 inline mr-1" />
                  Voice
                </button>

                <button
                  onClick={handleSend}
                  disabled={!canSend}
                  className={`rounded-xl px-3 py-1.5 text-sm font-medium ${
                    canSend
                      ? "bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900"
                      : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 cursor-not-allowed"
                  }`}
                >
                  <Send className="w-4 h-4 inline mr-1" />
                  {sending ? "Sending…" : "Send"}
                </button>
              </div>
            </div>
          </div>

          <p className="mt-3 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            This is not therapy or crisis support. If you’re in danger, contact local emergency services.
          </p>
        </div>
      </div>
    </div>
  );
}

function MessageBubble({ msg }: { msg: Msg }) {
  const isUser = msg.role === "user";

  return (
    <div className={`flex items-start gap-2 ${isUser ? "justify-end" : "justify-start"}`}>
      {!isUser && (
        <div className="mt-1 shrink-0 rounded-full p-1.5 bg-zinc-200/70 dark:bg-zinc-800/80">
          <Bot className="w-4 h-4" />
        </div>
      )}

      <div
        className={`max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-6 shadow-sm ${
          isUser
            ? "bg-zinc-900 text-zinc-50 dark:bg-zinc-100 dark:text-zinc-900"
            : "bg-white text-zinc-900 dark:bg-zinc-900 dark:text-zinc-100 border border-zinc-200/60 dark:border-zinc-800/60"
        }`}
      >
        <div className="whitespace-pre-wrap">{msg.content}</div>
        <div className="mt-1.5 text-[10px] text-zinc-500">
          {fmtTime(new Date(msg.ts))}
        </div>
      </div>

      {isUser && (
        <div className="mt-1 shrink-0 rounded-full p-1.5 bg-zinc-200/70 dark:bg-zinc-800/80">
          <User className="w-4 h-4" />
        </div>
      )}
    </div>
  );
}