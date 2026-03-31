(() => {
  const root = document.getElementById("chatbot-root");
  if (!root) return;

  const apiUrl = root.getAttribute("data-chatbot-api-url");
  if (!apiUrl) return;

  const storageKey = "chatbot_history_v1";
  const maxTurns = 10; // last 10 turns = 20 messages (user+assistant)

  const el = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else node.setAttribute(key, value);
    }
    for (const child of children) node.appendChild(child);
    return node;
  };

  const getCookie = (name) => {
    const value = `; ${document.cookie}`;
    const parts = value.split(`; ${name}=`);
    if (parts.length === 2) return parts.pop().split(";").shift();
    return "";
  };

  const state = {
    open: false,
    suggested: [],
  };

  const fab = el("button", { class: "cb-fab", type: "button", text: "AI Chat" });
  const panel = el("section", { class: "cb-panel", "aria-hidden": "true" });
  const header = el("header", { class: "cb-header" }, [
    el("div", { class: "cb-title", text: "AI Chat" }),
  ]);
  const actions = el("div", { class: "cb-actions" });
  const btnReset = el("button", { class: "cb-iconbtn", type: "button", text: "Reset" });
  const btnDelete = el("button", { class: "cb-iconbtn", type: "button", text: "Delete" });
  const btnClose = el("button", { class: "cb-iconbtn", type: "button", text: "X" });
  actions.appendChild(btnReset);
  actions.appendChild(btnDelete);
  actions.appendChild(btnClose);
  header.appendChild(actions);

  const messages = el("div", { class: "cb-messages" });
  const suggest = el("div", { class: "cb-suggest" });
  const input = el("input", { class: "cb-input", placeholder: "Ask something…", type: "text" });
  const send = el("button", { class: "cb-send", type: "button", text: "Send" });
  const inputbar = el("div", { class: "cb-inputbar" }, [input, send]);

  panel.appendChild(header);
  panel.appendChild(messages);
  panel.appendChild(suggest);
  panel.appendChild(inputbar);

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  const scrollToBottom = () => {
    messages.scrollTop = messages.scrollHeight;
  };

  const addMessage = (kind, text) => {
    const msg = el("div", { class: `cb-msg ${kind === "user" ? "cb-user" : "cb-bot"}` });
    msg.textContent = text;
    messages.appendChild(msg);
    scrollToBottom();
  };

  const loadHistory = () => {
    try {
      const raw = localStorage.getItem(storageKey);
      const parsed = raw ? JSON.parse(raw) : null;
      if (!Array.isArray(parsed)) return [];
      return parsed
        .filter((m) => m && typeof m === "object")
        .map((m) => ({ role: m.role, content: String(m.content || "") }))
        .filter((m) => (m.role === "user" || m.role === "assistant") && m.content.trim());
    } catch {
      return [];
    }
  };

  const trimHistory = (history) => {
    const maxMessages = maxTurns * 2;
    return history.slice(-maxMessages);
  };

  const saveHistory = (history) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(trimHistory(history)));
    } catch {
      // Ignore quota/blocked storage errors.
    }
  };

  const renderHistory = (history) => {
    messages.innerHTML = "";
    for (const m of history) {
      if (m.role === "assistant") addMessage("bot", String(m.content || ""));
      if (m.role === "user") addMessage("user", String(m.content || ""));
    }
    scrollToBottom();
  };

  const setSuggested = (items) => {
    state.suggested = Array.isArray(items) ? items.slice(0, 6) : [];
    suggest.innerHTML = "";
    for (const s of state.suggested) {
      const chip = el("button", { class: "cb-chip", type: "button", text: s });
      chip.addEventListener("click", () => {
        input.value = s;
        input.focus();
      });
      suggest.appendChild(chip);
    }
  };

  const fetchInit = async () => {
    const res = await fetch(apiUrl, { method: "GET", credentials: "same-origin" });
    const data = await res.json().catch(() => ({}));
    setSuggested(data.suggested_replies || []);
    const greeting = String(data.assistant_greeting || "").trim();
    return greeting || "Hi! How can I help?";
  };

  const sendMessage = async (text, history) => {
    const body = JSON.stringify({ message: text, history: trimHistory(history) });
    const res = await fetch(apiUrl, {
      method: "POST",
      credentials: "same-origin",
      headers: {
        "Content-Type": "application/json",
        "X-CSRFToken": getCookie("csrftoken"),
      },
      body,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok) {
      const err = String(data.reply || data.error || "Sorry—something went wrong sending that message.");
      const next = trimHistory([...history, { role: "assistant", content: err }]);
      saveHistory(next);
      renderHistory(next);
      setSuggested(data.suggested_replies || []);
      return next;
    }
    const reply = String(data.reply || "");
    const nextHistory = Array.isArray(data.history)
      ? trimHistory(
          data.history
            .filter((m) => m && typeof m === "object")
            .map((m) => ({ role: m.role, content: String(m.content || "") }))
            .filter((m) => (m.role === "user" || m.role === "assistant") && m.content.trim())
        )
      : trimHistory([...history, { role: "assistant", content: reply }]);
    saveHistory(nextHistory);
    renderHistory(nextHistory);
    setSuggested(data.suggested_replies || []);
    return nextHistory;
  };

  const open = async () => {
    state.open = true;
    panel.setAttribute("aria-hidden", "false");
    fab.textContent = "Chat Open";
    let history = loadHistory();
    if (!history.length) {
      const greeting = await fetchInit();
      history = [{ role: "assistant", content: greeting }];
      saveHistory(history);
    } else {
      // Still fetch suggested replies and keep them fresh.
      fetchInit().catch(() => {});
    }
    renderHistory(history);
    input.focus();
  };

  const close = () => {
    state.open = false;
    panel.setAttribute("aria-hidden", "true");
    fab.textContent = "AI Chat";
  };

  fab.addEventListener("click", () => (state.open ? close() : open()));
  btnClose.addEventListener("click", close);
  const deleteChat = async () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {}
    const greeting = await fetchInit().catch(() => "Hi! How can I help?");
    const history = [{ role: "assistant", content: greeting }];
    saveHistory(history);
    renderHistory(history);
  };
  btnDelete.addEventListener("click", deleteChat);
  btnReset.addEventListener("click", deleteChat);

  send.addEventListener("click", async () => {
    const text = input.value.trim();
    if (!text) return;
    input.value = "";
    const history = trimHistory([...loadHistory(), { role: "user", content: text }]);
    saveHistory(history);
    renderHistory(history);
    await sendMessage(text, history);
  });
  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") send.click();
  });
})();
