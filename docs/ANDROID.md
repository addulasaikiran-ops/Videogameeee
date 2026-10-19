# Packaging Wake Him With Love for Android

The game is a standard web app, so the simplest path to an installable Android
app is [Capacitor](https://capacitorjs.com/) — it wraps `dist/` in a native
WebView shell. The game already ships everything Capacitor needs:

- `capacitor.config.json` in the repo root (app id, name, web dir, landscape).
- A landscape-locked PWA manifest and touch controls that appear on
  touchscreen devices automatically.

> **Note:** no APK/AAB exists yet — producing one requires the steps below on a
> machine with Android Studio + the Android SDK installed.

## What you need to install first

1. **Android Studio** (includes the Android SDK, emulator, and `adb`).
2. **JDK 17** (Android Studio bundles one — `File → Settings → Build Tools → Gradle → Gradle JDK`).
3. Capacitor packages (next step).

## One-time setup

```bash
npm run build                       # produces dist/
npm install -D @capacitor/cli @capacitor/core @capacitor/android
npx cap add android                 # creates the android/ project (commit it)
```

`capacitor.config.json` is already configured:

```json
{
  "appId": "com.wakehimwithlove.game",
  "appName": "Wake Him With Love",
  "webDir": "dist",
  "android": { "allowMixedContent": false },
  "plugins": { "CapacitorHttp": { "enabled": false } }
}
```

## Iterating

```bash
npm run build
npx cap sync android        # copies dist/ + config into the Android project
npx cap open android        # opens Android Studio
```

Then in Android Studio: **Run ▶** on an emulator or a USB-debugging phone, or
**Build → Build Bundle(s) / APK(s)** to produce an artifact.

## Before shipping a real build

- Replace the default Capacitor icon/splash in `android/app/src/main/res`.
- `orientation` is already locked to landscape in the manifest; mirror it in
  `android/app/src/main/AndroidManifest.xml`
  (`android:screenOrientation="landscape"`).
- The game has no network dependencies, so the WebView build needs no extra
  permissions beyond the defaults.
