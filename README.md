# Date-Time Offset Application (Dark Cosmic Edition)

## Objective
A modern, feature-rich Django web application that calculates and displays current server time with dynamic offsets. It features a stunning Dark Cosmic Glassmorphism UI and an integrated AI Chatbot.

## Key Features
- **Dynamic Offsets**: Calculate any time offset (e.g., 5.5 hours, -2 hours) in addition to the default 4-hour lab requirement.
- **World Time API**: Select any global timezone to fetch live data from an external API.
- **AI Chatbot**: Integrated Groq-powered assistant to help you understand the project or modify its logic.
- **Dark Cosmic Glassmorphism**: Premium themed UI with animated liquid background blobs and frosted glass cards.

## How to Run the Project

Follow these steps to get the application running locally:

### 0. Configure Environment (Recommended)
This repo does **not** commit secrets. Create a local `.env` file (gitignored) based on `.env.example`:
```bash
copy .env.example .env
```
Set at least:
- `DJANGO_SECRET_KEY`
- (optional) `CHATBOT_PROVIDER` + API key (`OPENAI_API_KEY` or `GROQ_API_KEY`)

### 1. Prerequisite: Install Django
Ensure you have Python installed, then install Django:
```bash
pip install django
```

### 2. Setup Database
The project uses SQLite and sessions (for the chatbot). Run migrations to initialize the database:
```bash
python manage.py migrate
```

### 3. Start the Development Server
Navigate to the project root directory and run:
```bash
python manage.py runserver
```

### 4. Open in Browser
Visit the following URLs:
- **Primary Page**: [http://127.0.0.1:8000/time/](http://127.0.0.1:8000/time/)
- **Root URL**: [http://127.0.0.1:8000/](http://127.0.0.1:8000/)

## How Time Offsets are Calculated
The app uses Python's `datetime.timedelta` in `offset_app/views.py`:
- **Current Time**: `dj_timezone.localtime(dj_timezone.now())`
- **Offset Calculation**: `current_time ± datetime.timedelta(hours=offset_hours)`
- **Standard Lab Requirement**: Default fixed offset is 4 hours before and ahead.

## Key Files
- `offset_app/views.py`: Core logic for time calculations and API endpoints.
- `offset_app/templates/offset_app/time_display.html`: The Dark Cosmic UI template.
- `chatbot/`: The full AI assistant application.
- `datetime_project/settings.py`: Global configuration and API key setup.

---
*Developed as a premium Django project lab exercise.*
