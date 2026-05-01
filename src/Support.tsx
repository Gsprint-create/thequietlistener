import React, { useEffect, useRef } from "react";

export default function Support() {
  const bmcRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Insert the official BMC script exactly where we want the button
    const script = document.createElement("script");
    script.type = "text/javascript";
    script.src = "https://cdnjs.buymeacoffee.com/1.0.0/button.prod.min.js";
    script.setAttribute("data-name", "bmc-button");
    script.setAttribute("data-slug", "georgelouka");      // ⬅️ your slug
    script.setAttribute("data-color", "#FFDD00");
    script.setAttribute("data-emoji", "☕");
    script.setAttribute("data-font", "Cookie");
    script.setAttribute("data-text", "Buy me a coffee");
    script.setAttribute("data-outline-color", "#000000");
    script.setAttribute("data-font-color", "#000000");
    script.setAttribute("data-coffee-color", "#ffffff");
    script.async = true;

    if (bmcRef.current) bmcRef.current.appendChild(script);
    return () => {
      // cleanup: remove script + any injected siblings if the page unmounts
      if (bmcRef.current) {
        bmcRef.current.innerHTML = "";
      }
    };
  }, []);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 text-center bg-zinc-50 dark:bg-zinc-900 text-zinc-800 dark:text-zinc-100">
      <div className="max-w-2xl w-full">
        <h1 className="text-3xl font-semibold mb-4">Support The Quiet Listener</h1>

        <p className="text-zinc-500 dark:text-zinc-400 leading-relaxed mb-6">
          The Quiet Listener is a calm, judgment-free space for reflection. If it helped you feel
          lighter, seen, or simply less alone for a moment, you can help keep it alive.
        </p>

        <p className="italic text-sm text-zinc-500 dark:text-zinc-400 mb-8">
          “Every small act of kindness helps keep the quiet alive for someone who needs to be heard.”
        </p>

        {/* Buy Me a Coffee button mounts here */}
        <div ref={bmcRef} className="mb-10" />

        <a
          href="/"
          className="inline-block px-6 py-2 rounded-2xl bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:opacity-90 transition"
        >
          ← Back to The Quiet Listener
        </a>

        <p className="text-xs text-zinc-500 mt-6">
          Donations are optional and go only toward hosting and maintenance costs.
        </p>
      </div>
    </div>
  );
}
