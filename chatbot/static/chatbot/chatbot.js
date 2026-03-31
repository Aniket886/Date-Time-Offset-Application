(() => {
  const root = document.getElementById("chatbot-root");
  if (!root) return;

  const apiUrl = root.getAttribute("data-chatbot-api-url");
  if (!apiUrl) return;
  const logoUrl = root.getAttribute("data-chatbot-logo-url") || "";

  const storageKey = "chatbot_history_v1";
  const maxTurns = 10;

  const el = (tag, attrs = {}, children = []) => {
    const node = document.createElement(tag);
    for (const [key, value] of Object.entries(attrs)) {
      if (key === "class") node.className = value;
      else if (key === "text") node.textContent = value;
      else if (key === "html") node.innerHTML = value;
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
    busy: false,
  };

  const fabLabel = el("div", { class: "cb-fab-label" }, [
    el("div", { class: "cb-fab-kicker", text: "AI" }),
    el("div", { class: "cb-fab-main", text: "Assistant" }),
  ]);
  const fab = el("button", { class: "cb-fab", type: "button", "aria-label": "Open AI chat" }, [fabLabel]);

  const panel = el("section", { class: "cb-panel", "aria-hidden": "true" });
  const brand = el("div", { class: "cb-brand" }, [
    el("div", { class: "cb-avatar" }, [
      el("img", { src: logoUrl, alt: "ChronoShift AI logo" }),
    ]),
    el("div", { class: "cb-titlewrap" }, [
      el("div", { class: "cb-kicker", text: "ChronoShift" }),
      el("div", { class: "cb-title", text: "AI Chat" }),
      el("div", { class: "cb-subtitle", text: "Help with offsets, timezones, and project updates." }),
    ]),
  ]);

  const actions = el("div", { class: "cb-actions" });
  const btnReset = el("button", { class: "cb-iconbtn", type: "button", text: "Reset", "data-variant": "reset" });
  const btnDelete = el("button", { class: "cb-iconbtn", type: "button", text: "Delete", "data-variant": "delete" });
  const btnClose = el("button", { class: "cb-iconbtn", type: "button", text: "Close", "data-variant": "close" });
  actions.appendChild(btnReset);
  actions.appendChild(btnDelete);
  actions.appendChild(btnClose);

  const header = el("header", { class: "cb-header" }, [brand, actions]);
  const messages = el("div", { class: "cb-messages" });
  const suggest = el("div", { class: "cb-suggest" });
  const input = el("input", { class: "cb-input", placeholder: "Ask about time offsets, chatbot setup, UI changes...", type: "text" });
  const inputWrap = el("div", { class: "cb-inputwrap" }, [
    el("div", { class: "cb-inputdot" }),
    input,
  ]);
  const send = el("button", { class: "cb-send", type: "button", text: "Send" });
  const inputbar = el("div", { class: "cb-inputbar" }, [inputWrap, send]);
  const stage = el("div", { class: "cb-stage" }, [messages, suggest, inputbar]);

  panel.appendChild(header);
  panel.appendChild(stage);

  document.body.appendChild(fab);
  document.body.appendChild(panel);

  const scrollToBottom = () => {
    messages.scrollTop = messages.scrollHeight;
  };

  const setEmptyState = () => {
    messages.innerHTML = "";
    messages.appendChild(
      el("div", { class: "cb-empty" }, [
        el("div", { class: "cb-empty-bubble" }, [
          el("div", { class: "cb-empty-title", text: "Ask anything about the project" }),
          el("div", {
            class: "cb-empty-copy",
            text: "Ask about the Django app, time offsets, timezone features, or UI changes.",
          }),
        ]),
      ])
    );
  };

  const addMessage = (kind, text) => {
    const label = kind === "user" ? "You" : "AI Chat";
    const bubble = el("div", { class: `cb-msg ${kind === "user" ? "cb-user" : "cb-bot"}` }, [
      el("div", { text }),
      el("div", { class: "cb-msgmeta", text: label }),
    ]);
    const row = el("div", { class: `cb-msgrow ${kind === "user" ? "cb-user-row" : "cb-bot-row"}` }, [bubble]);
    messages.appendChild(row);
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

  const trimHistory = (history) => history.slice(-(maxTurns * 2));

  const saveHistory = (history) => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(trimHistory(history)));
    } catch {
      // Ignore storage failures.
    }
  };

  const renderHistory = (history) => {
    messages.innerHTML = "";
    if (!history.length) {
      setEmptyState();
      return;
    }
    for (const m of history) {
      if (m.role === "assistant") addMessage("bot", String(m.content || ""));
      if (m.role === "user") addMessage("user", String(m.content || ""));
    }
    scrollToBottom();
  };

  const setSuggested = (items) => {
    state.suggested = Array.isArray(items) ? items.slice(0, 6) : [];
    suggest.innerHTML = "";
    for (const item of state.suggested) {
      const chip = el("button", { class: "cb-chip", type: "button", text: item });
      chip.addEventListener("click", () => {
        input.value = item;
        input.focus();
      });
      suggest.appendChild(chip);
    }
  };

  const setBusy = (busy) => {
    state.busy = busy;
    input.disabled = busy;
    send.disabled = busy;
    btnReset.disabled = busy;
    btnDelete.disabled = busy;
    send.textContent = busy ? "Sending..." : "Send";
  };

  const fetchInit = async () => {
    try {
      const res = await fetch(apiUrl, { method: "GET", credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      setSuggested(data.suggested_replies || []);
      const greeting = String(data.assistant_greeting || "").trim();
      return greeting || "Hi! How can I help?";
    } catch {
      setSuggested([]);
      return "Hi! How can I help?";
    }
  };

  const appendServiceError = (history) => {
    const next = trimHistory([
      ...history,
      {
        role: "assistant",
        content: "I couldn't reach the chatbot service. Check the server and API configuration, then try again.",
      },
    ]);
    saveHistory(next);
    renderHistory(next);
    return next;
  };

  const sendMessage = async (text, history) => {
    try {
      const res = await fetch(apiUrl, {
        method: "POST",
        credentials: "same-origin",
        headers: {
          "Content-Type": "application/json",
          "X-CSRFToken": getCookie("csrftoken"),
        },
        body: JSON.stringify({ message: text, history: trimHistory(history) }),
      });

      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        const err = String(data.reply || data.error || "Sorry, something went wrong sending that message.");
        const next = trimHistory([...history, { role: "assistant", content: err }]);
        saveHistory(next);
        renderHistory(next);
        setSuggested(data.suggested_replies || []);
        return next;
      }

      const nextHistory = Array.isArray(data.history)
        ? trimHistory(
            data.history
              .filter((m) => m && typeof m === "object")
              .map((m) => ({ role: m.role, content: String(m.content || "") }))
              .filter((m) => (m.role === "user" || m.role === "assistant") && m.content.trim())
          )
        : trimHistory([...history, { role: "assistant", content: String(data.reply || "") }]);

      saveHistory(nextHistory);
      renderHistory(nextHistory);
      setSuggested(data.suggested_replies || []);
      return nextHistory;
    } catch {
      return appendServiceError(history);
    }
  };

  const open = async () => {
    state.open = true;
    panel.setAttribute("aria-hidden", "false");
    fab.setAttribute("aria-label", "Close AI chat");

    let history = loadHistory();
    if (!history.length) {
      const greeting = await fetchInit();
      history = [{ role: "assistant", content: greeting }];
      saveHistory(history);
    } else {
      fetchInit().catch(() => {});
    }

    renderHistory(history);
    input.focus();
  };

  const close = () => {
    state.open = false;
    panel.setAttribute("aria-hidden", "true");
    fab.setAttribute("aria-label", "Open AI chat");
  };

  const resetChat = async () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore storage failures.
    }
    const greeting = await fetchInit();
    const history = [{ role: "assistant", content: greeting }];
    saveHistory(history);
    renderHistory(history);
    input.value = "";
    input.focus();
  };

  const deleteChat = () => {
    try {
      localStorage.removeItem(storageKey);
    } catch {
      // Ignore storage failures.
    }
    setSuggested([]);
    input.value = "";
    renderHistory([]);
    input.focus();
  };

  fab.addEventListener("click", () => (state.open ? close() : open()));
  btnClose.addEventListener("click", close);
  btnReset.addEventListener("click", resetChat);
  btnDelete.addEventListener("click", deleteChat);

  send.addEventListener("click", async () => {
    if (state.busy) return;

    const text = input.value.trim();
    if (!text) return;

    input.value = "";
    const previousHistory = trimHistory(loadHistory());
    const optimisticHistory = trimHistory([...previousHistory, { role: "user", content: text }]);
    saveHistory(optimisticHistory);
    renderHistory(optimisticHistory);

    setBusy(true);
    try {
      await sendMessage(text, previousHistory);
    } finally {
      setBusy(false);
      input.focus();
    }
  });

  input.addEventListener("keydown", (e) => {
    if (e.key === "Enter") send.click();
  });

  renderHistory(loadHistory());
})();
