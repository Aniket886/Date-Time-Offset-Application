(() => {
  const wrapper = document.querySelector(".wrapper[data-server-epoch-ms]");
  const serverEpochRaw = wrapper ? wrapper.getAttribute("data-server-epoch-ms") : "";
  const serverEpochMs = serverEpochRaw ? Number(serverEpochRaw) : NaN;
  const baseServerMs = Number.isFinite(serverEpochMs) ? serverEpochMs : Date.now();
  const baseLocalMs = Date.now();

  const beforeCard = document.getElementById("card-before");
  const currentCard = document.getElementById("card-current");
  const aheadCard = document.getElementById("card-ahead");
  if (!beforeCard || !currentCard || !aheadCard) return;

  const beforeEl = beforeCard.querySelector(".card-time");
  const currentEl = currentCard.querySelector(".card-time");
  const aheadEl = aheadCard.querySelector(".card-time");
  if (!beforeEl || !currentEl || !aheadEl) return;

  const hoursInput = document.querySelector('input[name="hours"]');
  const readOffsetHours = () => {
    const raw = hoursInput ? String(hoursInput.value || "").trim() : "";
    const parsed = raw ? Number(raw) : 4;
    if (!Number.isFinite(parsed)) return 4;
    return Math.max(-48, Math.min(48, parsed));
  };

  const fmt = new Intl.DateTimeFormat("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
    second: "2-digit",
  });

  const render = () => {
    const now = new Date(baseServerMs + (Date.now() - baseLocalMs));
    const offsetHours = readOffsetHours();
    const deltaMs = offsetHours * 60 * 60 * 1000;

    currentEl.textContent = fmt.format(now);
    beforeEl.textContent = fmt.format(new Date(now.getTime() - deltaMs));
    aheadEl.textContent = fmt.format(new Date(now.getTime() + deltaMs));
  };

  render();
  setInterval(render, 1000);
})();
