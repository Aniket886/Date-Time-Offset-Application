# Date-Time Offset Application

<p align="center">
  A polished time utility built with Django, extended into web, PWA, and Android-ready delivery flows.
</p>

<p align="center">
  <img src="https://img.shields.io/badge/Django-5.x-0f172a?style=for-the-badge&logo=django&logoColor=white" alt="Django">
  <img src="https://img.shields.io/badge/PWA-Ready-0ea5e9?style=for-the-badge" alt="PWA Ready">
  <img src="https://img.shields.io/badge/Capacitor-Android-2563eb?style=for-the-badge&logo=capacitor&logoColor=white" alt="Capacitor Android">
  <img src="https://img.shields.io/badge/Chatbot-Optional-111827?style=for-the-badge" alt="Optional Chatbot">
</p>

## Overview

This project started as a date-time offset calculator and has grown into a cleaner multi-surface app:

- A Django web app for live server time and adjustable offsets
- A world-time lookup flow powered by an external time API
- An optional chatbot layer with local, OpenAI, or Groq-backed modes
- Separate PWA and Capacitor-based APK variants for broader delivery

The current repository is best understood as one core experience delivered in three formats.

## Why It Stands Out

- Adjustable hour offsets with sensible defaults and input clamping
- Real-time server-backed time display using Django timezone utilities
- Timezone lookup endpoints for global time checks
- Session-backed chatbot integration with provider-based configuration
- A stylized dark interface instead of a plain lab-style template
- PWA packaging for installable browser-based use
- Capacitor packaging for Android build workflows

## Experience Map

| Surface | Purpose | Folder |
|---|---|---|
| Django app | Main product experience and API endpoints | `./` |
| PWA variant | Installable browser app flow | `pwa_version/` |
| APK variant | Android packaging and native build path | `apk_version/` |

## Tech Stack

| Layer | Tools |
|---|---|
| Backend | Django, Python, SQLite |
| Time handling | `datetime`, Django timezone utilities |
| External data | `gettimeapi.dev` |
| Chat providers | Local mode, OpenAI-compatible mode, Groq-compatible mode |
| Packaging | PWA assets, Capacitor Android |

## Project Structure

```text
Date-Time-Offset-Application-main/
|-- datetime_project/      Django settings and URL routing
|-- offset_app/            Time UI, offset logic, timezone APIs
|-- chatbot/               Chat routes and assistant logic
|-- pwa_version/           Progressive Web App variant
|-- apk_version/           Capacitor + Android variant
|-- manage.py              Django entry point
|-- .env.example           Local configuration template
|-- db.sqlite3             Development database
```

## Main App Features

### Time Offset Flow

The main page calculates:

- Current local server time
- Time ahead by a chosen offset
- Time before by the same offset

If no value is supplied, the app defaults to a `4` hour offset. User input is clamped to the range `-48` to `48`.

### World Time API

The app exposes timezone-driven lookup endpoints through the configured time API base URL:

- `GET /time/` for the main interface
- `GET /time/timezones_api/` for timezone list data
- `GET /time/time_api/?timezone=Asia/Kolkata` for a selected timezone

### Chatbot Layer

The chatbot module is configurable by environment variables and can run in:

- `local` mode
- `openai` mode
- `groq` mode

This keeps the default setup lightweight while allowing upgrades when API keys are available.

## Quick Start

### 1. Create a local environment file

```powershell
copy .env.example .env
```

Minimum fields to review:

- `DJANGO_SECRET_KEY`
- `DJANGO_DEBUG`
- `DJANGO_ALLOWED_HOSTS`
- `CHATBOT_PROVIDER`
- `OPENAI_API_KEY` or `GROQ_API_KEY` if using a hosted provider

### 2. Install Python dependencies

```powershell
pip install django
```

If you prefer an isolated environment:

```powershell
python -m venv .venv
.venv\Scripts\activate
pip install django
```

### 3. Apply database migrations

```powershell
python manage.py migrate
```

### 4. Run the app

```powershell
python manage.py runserver
```

Open:

- `http://127.0.0.1:8000/`
- `http://127.0.0.1:8000/time/`
- `http://127.0.0.1:8000/chat/`

## Configuration

| Variable | Purpose | Default |
|---|---|---|
| `DJANGO_SECRET_KEY` | Django secret key | `django-insecure-change-me` |
| `DJANGO_DEBUG` | Debug toggle | `1` |
| `DJANGO_ALLOWED_HOSTS` | Comma-separated hosts | empty |
| `TIME_API_BASE_URL` | World time API source | `https://gettimeapi.dev` |
| `CHATBOT_PROVIDER` | `local`, `openai`, or `groq` | `local` |
| `OPENAI_API_KEY` | Required for OpenAI mode | empty |
| `OPENAI_MODEL` | OpenAI model name | `gpt-4o-mini` |
| `OPENAI_BASE_URL` | OpenAI-compatible endpoint | `https://api.openai.com` |
| `GROQ_API_KEY` | Required for Groq mode | empty |
| `GROQ_MODEL` | Groq model name | `llama-3.1-8b-instant` |
| `GROQ_BASE_URL` | Groq endpoint | `https://api.groq.com/openai` |

## PWA Variant

The `pwa_version/` folder packages the experience as an installable Progressive Web App with offline-oriented behavior.

Typical flow:

```powershell
cd pwa_version
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
copy .env.example .env
python manage.py migrate
python manage.py runserver
```

Use this variant when you want a browser-installable experience without a native Android toolchain.

## APK Variant

The `apk_version/` folder packages the app with Capacitor for Android delivery.

Typical flow:

```powershell
cd apk_version
npm install
npx cap sync android
npx cap open android
```

From Android Studio, build:

- Debug APK: `android/app/build/outputs/apk/debug/app-debug.apk`
- Release APK: `android/app/build/outputs/apk/release/app-release.apk`

Use this variant when you need native Android packaging rather than a browser-based install.

## Implementation Notes

- Core time calculations live in `offset_app/views.py`
- URL routing is defined in `datetime_project/urls.py`
- The app uses SQLite for development
- Timezone list responses are cached in memory for 24 hours
- Remote timezone data is fetched using the configured `TIME_API_BASE_URL`

## Best Entry Points

- `offset_app/views.py` for business logic
- `offset_app/templates/offset_app/time_display.html` for the UI
- `chatbot/` for assistant integration
- `pwa_version/` for installable web packaging
- `apk_version/` for Android build packaging

## Use Cases

- Academic demos for server time and offset calculations
- Small utility dashboards for timezone checks
- Starter projects for Django-to-PWA packaging
- Starter projects for Django-inspired Android wrapping with Capacitor

## License

This repository does not currently declare a license file. Add one before distributing or reusing it beyond personal or internal work.

## Profile

GitHub: https://github.com/Aniket886
