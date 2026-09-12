/**
 * Ban-safe helper: never auto-clicks Post.
 * Tries to fill the composer; always leaves final Post click to the human.
 */
(function () {
  const PARAM = "grouppost_body";

  function getBodyFromUrl() {
    try {
      const u = new URL(location.href);
      return u.searchParams.get(PARAM);
    } catch {
      return null;
    }
  }

  function findComposer() {
    const selectors = [
      '[role="textbox"][contenteditable="true"]',
      'div[contenteditable="true"][data-contents="true"]',
      'div[aria-label*="Write something" i]',
      'div[aria-label*="Create a public post" i]',
      'div[aria-label*="What\'s on your mind" i]',
    ];
    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el) return el;
    }
    return null;
  }

  async function tryFill(text) {
    const box = findComposer();
    if (!box) return false;
    box.focus();
    try {
      document.execCommand("selectAll", false);
      document.execCommand("insertText", false, text);
      if ((box.innerText || "").trim().length === 0) {
        box.textContent = text;
        box.dispatchEvent(new InputEvent("input", { bubbles: true }));
      }
      return true;
    } catch {
      return false;
    }
  }

  async function run() {
    const body = getBodyFromUrl();
    if (!body) return;

    // Strip query param so refreshes don't re-inject forever
    try {
      const u = new URL(location.href);
      u.searchParams.delete(PARAM);
      history.replaceState({}, "", u.toString());
    } catch {
      /* ignore */
    }

    await navigator.clipboard.writeText(body).catch(() => {});

    let filled = false;
    for (let i = 0; i < 12 && !filled; i++) {
      filled = await tryFill(body);
      if (!filled) await new Promise((r) => setTimeout(r, 500));
    }

    const tip = document.createElement("div");
    tip.textContent = filled
      ? "GroupPost: draft filled — review, then click Post yourself."
      : "GroupPost: text copied — paste into the composer (Ctrl/Cmd+V), then click Post.";
    Object.assign(tip.style, {
      position: "fixed",
      bottom: "16px",
      right: "16px",
      zIndex: "2147483647",
      background: "#111827",
      color: "#fff",
      padding: "10px 14px",
      borderRadius: "10px",
      font: "13px/1.4 system-ui,sans-serif",
      boxShadow: "0 8px 24px rgba(0,0,0,.25)",
      maxWidth: "280px",
    });
    document.documentElement.appendChild(tip);
    setTimeout(() => tip.remove(), 8000);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", run);
  } else {
    run();
  }
})();
