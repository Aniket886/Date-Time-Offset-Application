(() => {
  const wrapper = document.querySelector(".wrapper[data-time-url][data-timezones-url]");
  if (!wrapper) return;

  const timeUrl = wrapper.getAttribute("data-time-url");
  const timezonesUrl = wrapper.getAttribute("data-timezones-url");

  const tzSelect = document.getElementById("tz-select");
  const tzInput = document.getElementById("tz-input");
  const tzList = document.getElementById("tz-list");
  const tzFetch = document.getElementById("tz-fetch");
  const tzStatus = document.getElementById("tz-status");
  const tzResult = document.getElementById("tz-result");
  const netStatus = document.getElementById("net-status");

  if (!tzSelect || !tzInput || !tzList || !tzFetch || !tzStatus || !tzResult) return;

  const syncNetworkBadge = () => {
    if (!netStatus) return;
    netStatus.classList.toggle("offline", !navigator.onLine);
  };

  const setStatus = (text) => {
    tzStatus.textContent = text;
  };

  const setResult = (text) => {
    tzResult.textContent = text || "";
  };

  const loadTimezones = async () => {
    try {
      const res = await fetch(timezonesUrl, { method: "GET", credentials: "same-origin" });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const tzs = Array.isArray(data.timezones) ? data.timezones : [];

      tzSelect.innerHTML = "";
      tzList.innerHTML = "";
      const placeholder = document.createElement("option");
      placeholder.value = "";
      placeholder.textContent = "Select a timezone...";
      tzSelect.appendChild(placeholder);
      for (const name of tzs.slice(0, 2000)) {
        const option = document.createElement("option");
        option.value = String(name);
        option.textContent = String(name);
        tzSelect.appendChild(option);

        const opt = document.createElement("option");
        opt.value = String(name);
        tzList.appendChild(opt);
      }
      setStatus("Pick a timezone (or type your own) and click “Get Time”.");

      if (!tzInput.value) tzInput.value = "UTC";
      if (tzSelect.options.length > 1) {
        const hasUTC = Array.from(tzSelect.options).some((o) => o.value === "UTC");
        tzSelect.value = hasUTC ? "UTC" : tzSelect.options[1].value;
        tzInput.value = tzSelect.value;
      }
    } catch (e) {
      setStatus("Couldn't load timezones list (you can still type one like UTC or Asia/Kolkata).");
      if (!tzInput.value) tzInput.value = "UTC";
      tzSelect.innerHTML = "";
      const fallback = document.createElement("option");
      fallback.value = "UTC";
      fallback.textContent = "UTC";
      tzSelect.appendChild(fallback);
      tzSelect.value = "UTC";
    }
  };

  let worldTickTimer = null;
  let activeOffset = "";
  let baseServerMs = null;
  let baseLocalMs = null;

  const startWorldTick = (timezone) => {
    if (worldTickTimer) clearInterval(worldTickTimer);

    let fmt;
    try {
      fmt = new Intl.DateTimeFormat("en-US", {
        timeZone: timezone,
        year: "numeric",
        month: "long",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        second: "2-digit",
      });
    } catch (e) {
      setStatus("Invalid timezone. Example: UTC, Asia/Kolkata, Europe/London");
      setResult("");
      return;
    }

    const tick = () => {
      const driftMs =
        typeof baseServerMs === "number" && typeof baseLocalMs === "number"
          ? Date.now() - baseLocalMs
          : 0;
      const date = new Date((baseServerMs || Date.now()) + driftMs);
      setResult(`${fmt.format(date)} (${timezone})`);
      setStatus(activeOffset ? `${timezone} (${activeOffset})` : timezone);
    };
    tick();
    worldTickTimer = setInterval(tick, 1000);
  };

  const fetchTime = async () => {
    const timezone = (tzInput.value || "").trim();
    if (!timezone) {
      setStatus("Enter a timezone first (example: Asia/Kolkata).");
      return;
    }

    activeOffset = "";
    baseServerMs = null;
    baseLocalMs = Date.now();

    setStatus(`Fetching time for ${timezone}…`);
    setResult("");

    const url = `${timeUrl}?timezone=${encodeURIComponent(timezone)}`;
    try {
      const res = await fetch(url, { method: "GET", credentials: "same-origin" });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setStatus(data.error || "Failed to fetch time.");
        return;
      }

      activeOffset = data.offset ? String(data.offset) : "";
      if (typeof data.timestamp === "number") {
        baseServerMs = data.timestamp * 1000;
      } else if (typeof data.iso8601 === "string") {
        const parsed = Date.parse(data.iso8601);
        if (Number.isFinite(parsed)) baseServerMs = parsed;
      }

      startWorldTick(timezone);
    } catch (e) {
      setStatus("Failed to fetch time (network error).");
    }
  };

  tzFetch.addEventListener("click", fetchTime);
  tzSelect.addEventListener("change", () => {
    tzInput.value = String(tzSelect.value || "").trim();
    if (tzInput.value) fetchTime();
  });
  tzInput.addEventListener("keydown", (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      fetchTime();
    }
  });

  window.addEventListener("online", syncNetworkBadge);
  window.addEventListener("offline", syncNetworkBadge);
  syncNetworkBadge();
  loadTimezones();
})();
