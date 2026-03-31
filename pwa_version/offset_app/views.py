import datetime
import json
import time
import urllib.parse
import urllib.request

from django.conf import settings
from django.http import JsonResponse
from django.shortcuts import render
from django.utils import timezone as dj_timezone
from django.views.decorators.csrf import ensure_csrf_cookie
from django.views.decorators.http import require_GET


@ensure_csrf_cookie
def time_offsets(request):
    current_time = dj_timezone.localtime(dj_timezone.now())

    hours_raw = (request.GET.get("hours") or "").strip()
    try:
        offset_hours = float(hours_raw) if hours_raw else 4.0
    except ValueError:
        offset_hours = 4.0

    offset_hours = max(-48.0, min(48.0, offset_hours))
    offset_hours_display = f"{offset_hours:g}"

    hours_ahead = current_time + datetime.timedelta(hours=offset_hours)
    hours_before = current_time - datetime.timedelta(hours=offset_hours)

    context = {
        "current_time": current_time,
        "four_hours_ahead": hours_ahead,
        "four_hours_before": hours_before,
        "offset_hours": offset_hours,
        "offset_hours_display": offset_hours_display,
        "server_epoch_ms": int(current_time.timestamp() * 1000),
    }

    return render(request, "offset_app/time_display.html", context)


_TIMEZONES_CACHE = {"ts": 0.0, "data": None}
_TIMEZONES_TTL_SECONDS = 24 * 60 * 60


def _time_api_base_url():
    base = getattr(settings, "TIME_API_BASE_URL", "") or "https://gettimeapi.dev"
    return base.rstrip("/")


def _fetch_json(url, timeout_seconds=12):
    with urllib.request.urlopen(url, timeout=timeout_seconds) as response:
        charset = response.headers.get_content_charset() or "utf-8"
        return json.loads(response.read().decode(charset))


@require_GET
def timezones_api(request):
    now = time.time()
    cached = _TIMEZONES_CACHE.get("data")
    if cached and (now - float(_TIMEZONES_CACHE.get("ts") or 0.0)) < _TIMEZONES_TTL_SECONDS:
        return JsonResponse({"timezones": cached})

    url = f"{_time_api_base_url()}/v1/timezones"
    try:
        data = _fetch_json(url)
    except Exception as exc:
        return JsonResponse({"error": "Failed to fetch timezones.", "details": type(exc).__name__}, status=502)

    timezones = data.get("timezones")
    if not isinstance(timezones, list):
        return JsonResponse({"error": "Unexpected timezones response."}, status=502)

    names = []
    for item in timezones:
        if isinstance(item, dict) and isinstance(item.get("name"), str):
            names.append(item["name"])
        elif isinstance(item, str):
            names.append(item)

    names = sorted(set(names))
    _TIMEZONES_CACHE["ts"] = now
    _TIMEZONES_CACHE["data"] = names
    return JsonResponse({"timezones": names})


@require_GET
def time_api(request):
    timezone = (request.GET.get("timezone") or "").strip()
    if not timezone:
        return JsonResponse({"error": "Missing timezone query parameter."}, status=400)

    qs = urllib.parse.urlencode({"timezone": timezone})
    url = f"{_time_api_base_url()}/v1/time?{qs}"
    try:
        data = _fetch_json(url)
    except Exception as exc:
        return JsonResponse({"error": "Failed to fetch time.", "details": type(exc).__name__}, status=502)

    return JsonResponse({
        "timezone": data.get("timezone") or timezone,
        "iso8601": data.get("iso8601"),
        "date": data.get("date"),
        "time": data.get("time"),
        "offset": data.get("offset"),
        "abbr": data.get("abbr"),
        "timestamp": data.get("timestamp"),
    })
