(function () {
    const wrapper = document.querySelector(".wrapper");
    if (!wrapper) return;

    const timeUrl = wrapper.dataset.timeUrl || "/api/time/";
    const timezonesUrl = wrapper.dataset.timezonesUrl || "/api/timezones/";

    const tzSelect = document.getElementById("tz-select");
    const tzInput = document.getElementById("tz-input");
    const tzFetch = document.getElementById("tz-fetch");
    const tzStatus = document.getElementById("tz-status");
    const tzResult = document.getElementById("tz-result");
    const tzList = document.getElementById("tz-list");

    if (!tzSelect) return;

    async function loadTimezones() {
        if (!navigator.onLine) {
            tzStatus.textContent = "Offline - World time unavailable";
            return;
        }
        tzStatus.textContent = "Loading timezones...";
        try {
            const res = await fetch(timezonesUrl);
            const data = await res.json();
            if (data.timezones) {
                const optionsHtml = data.timezones
                    .map((tz) => `<option value="${escapeHtml(tz)}">${escapeHtml(tz)}</option>`)
                    .join("");
                tzSelect.innerHTML = `<option value="">Select timezone...</option>` + optionsHtml;
                if (tzList) {
                    tzList.innerHTML = optionsHtml;
                }
                tzStatus.textContent = `${data.timezones.length} timezones available`;
            } else if (data.error) {
                tzStatus.textContent = "Error: " + data.error;
            }
        } catch (e) {
            tzStatus.textContent = "Failed to load timezones. Will retry when online.";
        }
    }

    async function fetchTime() {
        const tz = tzSelect?.value || tzInput?.value || "";
        if (!tz.trim()) {
            tzStatus.textContent = "Please select or enter a timezone.";
            return;
        }
        tzStatus.textContent = "Fetching time...";
        tzResult.textContent = "";
        try {
            const res = await fetch(`${timeUrl}?timezone=${encodeURIComponent(tz)}`);
            const data = await res.json();
            if (data.error) throw new Error(data.error);
            tzResult.textContent = `${data.timezone}: ${data.date} ${data.time}`;
            tzStatus.textContent = "Timezone loaded successfully";
        } catch (e) {
            tzStatus.textContent = "Failed to fetch time. Check connection.";
        }
    }

    function escapeHtml(text) {
        const div = document.createElement("div");
        div.textContent = text;
        return div.innerHTML;
    }

    if (tzFetch) tzFetch.addEventListener("click", fetchTime);
    if (tzInput) {
        tzInput.addEventListener("keydown", (e) => {
            if (e.key === "Enter") fetchTime();
        });
    }

    loadTimezones();

    window.addEventListener("online", () => {
        tzStatus.textContent = "Back online. Reloading timezones...";
        loadTimezones();
    });
})();
