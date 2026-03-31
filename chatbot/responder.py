import json
import os
import re
import urllib.error
import urllib.request


DEFAULT_SUGGESTED_REPLIES = [
    "What does this app do?",
    "Explain the 4-hour offset",
    "How do I change the offset hours?",
    "How do I run this project?",
]


SYSTEM_PROMPT = (
    "You are an AI assistant embedded in a small Django project named "
    "'Date-Time Offset Application'. The page shows the server-computed current time, "
    "plus 4 hours, and minus 4 hours. Be helpful and concise. "
    "If the user’s request is ambiguous, ask 1-2 clarifying questions. "
    "If asked to change code, propose the exact file(s) and what to change. "
    "Never reveal secrets (API keys, tokens) or ask the user to paste them. "
    "Do not output any environment variable values. "
    "When unsure, prefer safe defaults and ask a clarifying question."
)


GREETING = (
    "Hi! I can help with this Django Date-Time Offset app (current time, +4 hours, -4 hours). "
    "What do you want to do—understand it, modify the offset, add time zones, or deploy it?"
)


def initial_messages():
    return [
        {"role": "system", "content": SYSTEM_PROMPT},
        {"role": "assistant", "content": GREETING},
    ]


class LocalResponder:
    def reply(self, messages, user_text):
        text = (user_text or "").strip()
        lower = text.lower()

        if not text:
            return GREETING, DEFAULT_SUGGESTED_REPLIES

        if lower in {"/reset", "/clear", "reset", "clear"}:
            return "Done—chat cleared. What would you like to ask next?", DEFAULT_SUGGESTED_REPLIES

        if any(k in lower for k in ["what does this app do", "what is this", "purpose", "about"]):
            return (
                "It renders the server’s current date/time and also shows two offsets: "
                "4 hours before and 4 hours ahead, computed in `offset_app/views.py` using `datetime.timedelta`.\n\n"
                "Do you want the offset to be configurable (user input), or should it stay fixed at 4 hours?"
            ), [
                "Make the offset configurable",
                "Keep 4 hours fixed",
                "Add timezone selection",
            ]

        if any(k in lower for k in ["offset", "4 hour", "four hour", "timedelta"]):
            return (
                "The offset is computed by adding/subtracting a `datetime.timedelta(hours=4)` "
                "from the current server time. That’s why you see “Four Hours Before” and “Four Hours Ahead”.\n\n"
                "Do you want offsets other than 4 hours (e.g., 30 minutes / 5.5 hours), or multiple presets?"
            ), [
                "Let user enter hours",
                "Add preset buttons",
                "Support minutes too",
            ]

        if any(k in lower for k in ["run", "start", "server", "manage.py"]):
            return (
                "To run locally:\n"
                "1) `python manage.py migrate`\n"
                "2) `python manage.py runserver`\n\n"
                "Are you using a virtual environment already, and which Python version?"
            ), [
                "Show virtualenv setup",
                "Create admin user",
            ]

        if any(k in lower for k in ["admin", "superuser", "login"]):
            return (
                "To use Django admin:\n"
                "1) `python manage.py createsuperuser`\n"
                "2) Visit `/admin/` and log in.\n\n"
                "Do you want the chatbot to be admin-only, or available to all visitors?"
            ), [
                "Admin-only chatbot",
                "Public chatbot",
            ]

        return (
            "I can help with this project. What’s your goal?\n"
            "- Change how the offset is calculated\n"
            "- Add time zone selection\n"
            "- Add an API endpoint\n"
            "- Deploy it\n\n"
            "Tell me which one, and any constraints (UI vs API-only, fixed vs user-entered offset)."
        ), [
            "Change offset logic",
            "Add time zones",
            "Add API endpoint",
        ]


class OpenAIResponder:
    def __init__(self, api_key, model, base_url):
        self._api_key = api_key
        self._model = model
        self._base_url = base_url.rstrip("/")

    def reply(self, messages, user_text):
        # Keep the API surface tiny and dependency-free (urllib).
        payload = {
            "model": self._model,
            "messages": messages + [{"role": "user", "content": user_text}],
            "temperature": 0.2,
            "max_tokens": 350,
        }

        request = urllib.request.Request(
            f"{self._base_url}/v1/chat/completions",
            data=json.dumps(payload).encode("utf-8"),
            headers={
                "Authorization": f"Bearer {self._api_key}",
                "Content-Type": "application/json",
                "Accept": "application/json",
                "User-Agent": "Django-Chatbot/1.0",
            },
            method="POST",
        )

        try:
            with urllib.request.urlopen(request, timeout=25) as response:
                data = json.loads(response.read().decode("utf-8"))
        except (urllib.error.URLError, urllib.error.HTTPError, TimeoutError, ValueError) as exc:
            fallback, suggested = LocalResponder().reply(messages, user_text)
            return (
                f"{fallback}\n\n(Heads up: the AI provider call failed: {type(exc).__name__})",
                suggested,
            )

        content = (
            (data.get("choices") or [{}])[0]
            .get("message", {})
            .get("content", "")
            .strip()
        )
        content = re.sub(r"\n{3,}", "\n\n", content)
        if not content:
            content = "I couldn’t generate a response. Can you rephrase your question?"
        return content, DEFAULT_SUGGESTED_REPLIES


def build_responder(settings):
    provider = (getattr(settings, "CHATBOT_PROVIDER", None) or os.getenv("CHATBOT_PROVIDER", "local")).strip().lower()
    if provider == "openai":
        api_key = getattr(settings, "OPENAI_API_KEY", None) or os.getenv("OPENAI_API_KEY", "")
        model = getattr(settings, "OPENAI_MODEL", None) or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        base_url = getattr(settings, "OPENAI_BASE_URL", None) or os.getenv("OPENAI_BASE_URL", "https://api.openai.com")
        if api_key:
            return OpenAIResponder(api_key=api_key, model=model, base_url=base_url)
    if provider == "groq":
        api_key = getattr(settings, "GROQ_API_KEY", None) or os.getenv("GROQ_API_KEY", "")
        model = getattr(settings, "GROQ_MODEL", None) or os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")
        base_url = getattr(settings, "GROQ_BASE_URL", None) or os.getenv("GROQ_BASE_URL", "https://api.groq.com/openai")
        if api_key:
            return OpenAIResponder(api_key=api_key, model=model, base_url=base_url)
    return LocalResponder()
