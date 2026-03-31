(function () {
    const serverEpochMs = document.querySelector("[data-server-epoch-ms]")?.dataset?.serverEpochMs;
    if (!serverEpochMs) return;

    const startMs = parseInt(serverEpochMs, 10);
    if (!startMs || isNaN(startMs)) return;

    const localStartMs = Date.now();

    function updateClock() {
        const liveEl = document.getElementById("live-time");
        if (!liveEl) return;

        const elapsed = Date.now() - localStartMs;
        const serverNow = new Date(startMs + elapsed);

        const options = {
            weekday: "long",
            year: "numeric",
            month: "long",
            day: "numeric",
            hour: "numeric",
            minute: "2-digit",
            second: "2-digit",
        };
        liveEl.textContent = serverNow.toLocaleString("en-US", options);
    }

    updateClock();
    setInterval(updateClock, 1000);
})();
