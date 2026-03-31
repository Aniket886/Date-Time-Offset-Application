# Time Offset APK

Native Android APK built with Capacitor.

## Prerequisites

- Node.js (v16+) - https://nodejs.org/
- Android Studio - https://developer.android.com/studio

## Quick Build Instructions

### Step 1: Install Dependencies

Open PowerShell/CMD in this folder:

```bash
cd Date-Time-Offset-Application-main/apk_version
npm install
```

### Step 2: Add Android Platform

```bash
npx cap add android
```

### Step 3: Sync Web Assets

```bash
npx cap sync android
```

### Step 4: Open in Android Studio

```bash
npx cap open android
```

Or manually open the `android/` folder in Android Studio.

### Step 5: Build APK

In Android Studio:
1. Wait for Gradle sync to complete
2. Go to **Build > Build Bundle(s) / APK(s) > Build APK(s)**
3. The APK will be generated at:
   `android/app/build/outputs/apk/debug/app-debug.apk`

## For Release APK (Signed)

In Android Studio:
1. **Build > Generate Signed Bundle / APK**
2. Select **APK**
3. Create or select your keystore
4. Choose **release** build variant
5. The signed APK will be at:
   `android/app/build/outputs/apk/release/app-release.apk`

## Project Structure

```
apk_version/
+-- www/                    # Static web files (HTML/JS/CSS)
¦   +-- index.html         # Main app
¦   +-- manifest.json      # PWA manifest
¦   +-- img/               # Icons
+-- android/               # Generated Android project (after cap add)
+-- capacitor.config.json  # Capacitor config
+-- package.json           # Node dependencies
```

## Updating the App

1. Edit files in `www/`
2. Run `npx cap sync android`
3. Rebuild in Android Studio

## Troubleshooting

### "cap command not found"
Run: `npm install -g @capacitor/cli`

### Gradle sync fails
In Android Studio: **File > Invalidate Caches / Restart**

### App shows white screen
Check that `www/index.html` exists and is valid.

## Features

- ? Native Android app (APK)
- ? Works offline
- ? Client-side time calculations
- ? Material design UI
- ? No server required
