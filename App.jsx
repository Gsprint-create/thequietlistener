import React, { useEffect, useMemo, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Mic, Trash2, Download, Lock, Unlock, Bot, User, Moon, Sun, Sparkles } from "lucide-react";

// -----------------------------
// No‑Judgment Talk — Prototype
// Single‑file React component, TailwindCSS
// - Anonymous chat w/ “Quiet Listener” (non‑judgmental bot)
// - Incognito toggle (no storage) or localStorage journal
// - Keyboard friendly (Enter to send, Shift+Enter for newline)
// - Transcript export (.txt)
// - Clean, calm UI
// -----------------------------

// Utilities
const fmtTime = (d: Date) =>
  d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });

const sleep = (ms: number) => new Promise((res) => setTimeout(res, ms));

// Rudimentary feeling words to mirror tone gently
const FEELINGS = [
  "tired", "alone", "lonely", "sad", "overwhelmed", "angry", "stressed",
  "worried", "anxious", "confused", "lost", "numb", "guilty", "ashamed",
  "frustrated", "hopeful", "relieved", "afraid", "fear", "hurt",
];

// Open questions that invite reflection
const OPEN_QUESTIONS = [
  "What feels most important about this right now?",
  "If you could name the core feeling in one word, what would it be?",
  "What would make the next hour just a little easier?",
  "What do you need more of — or less of — at this moment?",
  "If a close friend said this to you, how would you respond to them?",
  "What’s one small step you can take today?",
  "Where do you notice this in your body — shoulders, chest, stomach?",
  "What would ‘no judgment’ sound like to you right now?",
];

function extractFeeling(text: string): string | null {
  const lower = text.toLowerCase();
  const hit = FEELINGS.find((w) => lower.includes(w));
  return hit || null;
}

function paraphrase(text: string): string {
  // Gentle 1‑line paraphrase (very naive)
  const trimmed = text.replace(/\s+/g, " ").trim();
  if (!trimmed) return "";
  const max = 140;
  return trimmed.length > max ? trimmed.slice(0, max - 1) + "…" : trimmed;
}

function makeListenerReply(userText: string): string {
  const feeling = extractFeeling(userText);
  const mirror = paraphrase(userText);
  const opener = feeling
    ? `I hear that you’re feeling ${feeling}.`
    : `I’m here with you. I hear you.`;
  const normalize = `It makes sense to share this here — no fixing, no judgment.`;
  const ask = OPEN_QUESTIONS[Math.floor(Math.random() * OPEN_QUESTIONS.length)];
  return `${opener} ${normalize} You said: “${mirror}”. ${ask}`;
}

// Types
type Msg = {
  id: string;
  role: "user" | "listener";
  content: string;
  ts: number;
};

// Local storage keys
const LS_KEY = "noj_chat_session_v1";
const THEME_KEY = "noj_theme";

export default function NoJudgmentApp() {
  const [messages, setMessages] = useState<Msg[]>([]);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [incognito, setIncognito] = useState(true);
  const [theme, setTheme] = useState<"light" | "dark">(() =>
    (typeof window !== "undefined" && (localStorage.getItem(THEME_KEY) as any)) || "dark"
  );

  const bottomRef = useRef<HTMLDivElement | null>(null);
  const textAreaRef = useRef<HTMLTextAreaElement | null>(null);

  // Load from localStorage if not incognito
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!incognito) {
      const raw = localStorage.getItem(LS_KEY);
      if (raw) {
        try {
          const parsed: Msg[] = JSON.parse(raw);
          setMessages(parsed);
        } catch {}
      }
    }
  }, [incognito]);

  // Persist when not incognito
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!incognito) localStorage.setItem(LS_KEY, JSON.stringify(messages));
  }, [messages, incognito]);

  // Theme
  useEffect(() => {
    if (typeof window === "undefined") return;
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
    const userMsg: Msg = { id: `u-${now}`, role: "user", content: text, ts: now };
    setMessages((m) => [...m, userMsg]);

    setSending(true);
    await sleep(400 + Math.random() * 400);
    const reply = makeListenerReply(text);
    const botMsg: Msg = {
      id: `b-${Date.now()}`,
      role: "listener",
      content: reply,
      ts: Date.now(),
    };
    setMessages((m) => [...m, botMsg]);
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
    if (typeof window !== "undefined") localStorage.removeItem(LS_KEY);
  }

  function downloadTxt() {
    const header = `No‑Judgment Talk — Transcript (generated ${new Date().toLocaleString()})\n\n`;
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
    a.download = `no-judgment-transcript-${Date.now()}.txt`;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  }

  return (
    <div className="min-h-screen bg-zinc-50 text-zinc-900 dark:bg-zinc-950 dark:text-zinc-100 transition-colors">
      {/* Top Bar */}
      <div className="sticky top-0 z-10 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-black/40 border-b border-zinc-200/60 dark:border-zinc-800/60">
        <div className="mx-auto max-w-5xl px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <motion.div initial={{ rotate: -8, scale: 0.9 }} animate={{ rotate: 0, scale: 1 }}>
              <Sparkles className="w-5 h-5" />
            </motion.div>
            <div className="font-semibold tracking-tight">No‑Judgment Talk</div>
            <span className="text-xs text-zinc-500 dark:text-zinc-400 ml-2">prototype</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300/60 dark:border-zinc-700/60 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
            >
              {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>
            <button
              onClick={() => setIncognito((v) => !v)}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300/60 dark:border-zinc-700/60 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
              title={incognito ? "Incognito: nothing is stored" : "Journal: store this session locally"}
            >
              {incognito ? <Lock className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
              <span>{incognito ? "Incognito" : "Journal"}</span>
            </button>
            <button
              onClick={downloadTxt}
              className="inline-flex items-center gap-2 rounded-xl border border-zinc-300/60 dark:border-zinc-700/60 px-3 py-1.5 text-sm hover:bg-zinc-100 dark:hover:bg-zinc-900"
              title="Download transcript (.txt)"
            >
              <Download className="w-4 h-4" />
              <span>Export</span>
            </button>
            <button
              onClick={clearSession}
              className="inline-flex items-center gap-2 rounded-xl border border-red-200/70 dark:border-red-900/40 text-red-600 dark:text-red-400 px-3 py-1.5 text-sm rounded-xl hover:bg-red-50/70 dark:hover:bg-red-950/40"
              title="Clear everything instantly"
            >
              <Trash2 className="w-4 h-4" />
              <span>Clear</span>
            </button>
          </div>
        </div>
      </div>

      {/* Hero / Intent */}
      {messages.length === 0 && (
        <div className="mx-auto max-w-2xl px-4 pt-10 pb-4 text-center">
          <h1 className="text-2xl font-semibold tracking-tight">Talk freely. No fixing. No judgment.</h1>
          <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
            This space listens. Share as much or as little as you want. Your words stay on your device unless you toggle Journal mode.
          </p>
          <div className="mt-4 inline-flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
            <Bot className="w-4 h-4" /> <span>Quiet Listener responds with empathy and open questions.</span>
          </div>
        </div>
      )}

      {/* Chat area */}
      <div className="mx-auto max-w-3xl px-4 pb-28">
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
          <div ref={bottomRef} />
        </div>
      </div>

      {/* Composer */}
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
        <div className="flex items-center gap-2 text-xs text-zinc-500">
          <span className="inline-flex items-center gap-1">
            <Lock className="w-3.5 h-3.5" /> {incognito ? "Incognito" : "Journal saved locally"}
          </span>
          <span>•</span>
          <span>Enter to send</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            disabled
            className="inline-flex items-center gap-2 rounded-xl border border-zinc-300/60 dark:border-zinc-700/60 px-3 py-1.5 text-sm text-zinc-400 cursor-not-allowed"
            title="Voice notes — coming soon"
          >
            <Mic className="w-4 h-4" /> Voice
          </button>
          <button
            onClick={handleSend}
            disabled={!canSend}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-1.5 text-sm font-medium shadow-sm transition ${
              canSend
                ? "bg-zinc-900 text-white hover:bg-black dark:bg-zinc-100 dark:text-zinc-900 dark:hover:bg-white"
                : "bg-zinc-200 text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400 cursor-not-allowed"
            }`}
          >
            <Send className="w-4 h-4" />
            {sending ? "Sending…" : "Send"}
          </button>
        </div>
      </div>
    </div>

    <p className="mt-3 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
      This is a peer-style listening tool, not medical or crisis support. If you’re in danger or considering self-harm,
      please contact your local emergency number or a crisis line in your region.
    </p>
  </div>
</div>


          {/* Footer note */}
          <p className="mt-3 text-[11px] leading-relaxed text-zinc-500 dark:text-zinc-400">
            This is a peer‑style listening tool, not medical or crisis support. If you’re in danger or considering self‑harm,
            please contact your local emergency number or a crisis line in your region.
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
        <div className={`mt-1.5 text-[10px] ${isUser ? "text-zinc-300 dark:text-zinc-600" : "text-zinc-500 dark:text-zinc-400"}`}>
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
