// Same-origin call to Vercel function (no envs needed)
export async function getReply(message: string): Promise<string> {
  const res = await fetch("/api/reply", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message }),
  });
  if (!res.ok) {
    // optional: read text for debugging
    return "I'm here, listening, but I couldn’t reach the AI.";
  }
  const data = await res.json();
  return data.reply ?? "I'm here, listening.";
}
