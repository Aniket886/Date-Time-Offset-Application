import json
import time

from django.conf import settings
from django.http import HttpResponseBadRequest, JsonResponse
from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_http_methods

from .responder import DEFAULT_SUGGESTED_REPLIES, GREETING, build_responder, initial_messages


RATE_LIMIT_KEY = "chatbot_rate_limit_v1"
MAX_CONTEXT_TURNS = 10


@ensure_csrf_cookie
def chat_page(request):
    return render(request, "chatbot/chat_page.html", {"suggested_replies": DEFAULT_SUGGESTED_REPLIES})


@require_http_methods(["GET", "POST"])
def chat_api(request):
    if request.method == "GET":
        return JsonResponse(
            {
                "assistant_greeting": GREETING,
                "suggested_replies": DEFAULT_SUGGESTED_REPLIES,
            }
        )

    try:
        payload = json.loads(request.body.decode("utf-8"))
    except ValueError:
        return HttpResponseBadRequest("Invalid JSON body.")

    user_text = (payload.get("message") or "").strip()
    if not user_text:
        return HttpResponseBadRequest("Missing 'message'.")

    # Per-session rate limiting
    limit = int(getattr(settings, "CHATBOT_RATE_LIMIT_PER_MINUTE", 20) or 20)
    window_seconds = 60
    now = time.time()
    timestamps = request.session.get(RATE_LIMIT_KEY) or []
    if not isinstance(timestamps, list):
        timestamps = []
    timestamps = [t for t in timestamps if isinstance(t, (int, float)) and (now - float(t)) < window_seconds]
    if limit > 0 and len(timestamps) >= limit:
        retry_after = int(window_seconds - (now - float(timestamps[0])))
        request.session[RATE_LIMIT_KEY] = timestamps
        return JsonResponse(
            {
                "reply": f"Rate limit hit ({limit}/min). Please try again in ~{max(1, retry_after)}s.",
                "suggested_replies": DEFAULT_SUGGESTED_REPLIES,
            },
            status=429,
        )
    timestamps.append(now)
    request.session[RATE_LIMIT_KEY] = timestamps

    if user_text.lower() in {"/reset", "/clear", "reset", "clear"}:
        return JsonResponse(
            {
                "reply": "Done—chat cleared.",
                "suggested_replies": DEFAULT_SUGGESTED_REPLIES,
                "history": [{"role": "assistant", "content": GREETING}],
            }
        )

    raw_history = payload.get("history") or []
    history = []
    if isinstance(raw_history, list):
        for item in raw_history:
            if not isinstance(item, dict):
                continue
            role = item.get("role")
            content = item.get("content")
            if role not in {"user", "assistant"}:
                continue
            if not isinstance(content, str):
                continue
            content = content.strip()
            if not content:
                continue
            history.append({"role": role, "content": content[:4000]})

    if not history:
        history = [{"role": "assistant", "content": GREETING}]

    system_message = initial_messages()[0]
    context_history = history[-(MAX_CONTEXT_TURNS * 2) :]
    messages = [system_message, *context_history]

    responder = build_responder(settings)
    reply_text, suggested = responder.reply(messages, user_text)

    new_history = (context_history + [{"role": "user", "content": user_text}, {"role": "assistant", "content": reply_text}])[
        -(MAX_CONTEXT_TURNS * 2) :
    ]

    return JsonResponse(
        {
            "reply": reply_text,
            "suggested_replies": suggested or DEFAULT_SUGGESTED_REPLIES,
            "history": new_history,
        }
    )
