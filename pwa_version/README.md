# Date-Time Offset PWA

A Progressive Web App version of the Date-Time Offset application with offline support and install capabilities.

## Features

- **Progressive Web App (PWA)**: Install on your home screen like a native app
- **Offline Support**: Core time calculations work without internet
- **Service Worker**: Automatic caching and background sync
- **Install Prompt**: Browser-native "Add to Home Screen" functionality
- **Responsive Design**: Works on all screen sizes
- **Dark Cosmic Theme**: Glassmorphism UI with animated backgrounds
- **World Time API**: Fetch time from different timezones (online feature)

## Quick Start

### Prerequisites
- Python 3.8+
- pip

### Setup

```bash
# Create virtual environment (recommended)
python -m venv venv

# Activate virtual environment
# Windows:
venv\Scripts\activate
# macOS/Linux:
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Create environment file
copy .env.example .env

# Run migrations
python manage.py migrate

# Start development server
python manage.py runserver
```

### Access the App

- Open browser: http://127.0.0.1:8000/
- On mobile: Use your computer\'s IP address (e.g., http://192.168.1.x:8000/)

## Installing as PWA

### On Mobile (Android/iOS):
1. Open the app in Chrome/Safari
2. Tap "Add to Home Screen" in browser menu
3. The app installs and opens fullscreen

### On Desktop (Chrome/Edge):
1. Look for the install icon (?) in the address bar
2. Click "Install Date-Time Offset PWA"
3. App launches in its own window

## PWA Features

| Feature | Status |
|---------|--------|
| Service Worker | ? Offline caching |
| Manifest | ? Installable |
| Responsive | ? Mobile-first |
| Push Notifications | ? Not implemented |
| Background Sync | ? Not implemented |

## Project Structure

```
pwa_version/
+-- datetime_project/       # Django project config
¦   +-- settings.py
¦   +-- urls.py
¦   +-- wsgi.py
+-- offset_app/             # Main app
¦   +-- templates/          # HTML templates
¦   +-- static/             # Static assets
¦   ¦   +-- offset_app/     # JS files
¦   ¦   +-- pwa/            # PWA assets (manifest, sw)
¦   +-- views.py
¦   +-- urls.py
+-- manage.py
+-- requirements.txt
+-- README.md
```

## Offline Behavior

| Feature | Online | Offline |
|---------|--------|---------|
| Time calculations | ? Works | ? Works |
| World time API | ? Works | ? Shows cached data |
| Offset changes | ? Works | ? Works |
| UI/UX | ? Full | ? Full |

## Customizing Icons

Replace the generated icons in `offset_app/static/pwa/`:
- icon-72x72.png through icon-512x512.png
- Use a square icon with your logo

## Environment Variables

| Variable | Default | Description |
|----------|---------|-------------|
| DJANGO_SECRET_KEY | (required) | Django security key |
| DJANGO_DEBUG | 1 | Debug mode (0/1) |
| DJANGO_ALLOWED_HOSTS | (empty) | Allowed hosts |
| TIME_API_BASE_URL | https://gettimeapi.dev | World time API |

## License

Same as original project.
