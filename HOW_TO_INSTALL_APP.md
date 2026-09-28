# How to Install & Run the MoTA Scholarship App as a Mobile App

The Ministry of Tribal Affairs (MoTA) Unified ST Scholarship Platform is a complete **React Native Expo** application that can be run and installed as a mobile app through three straightforward methods:

---

## 📲 Method 1: Instant Standalone Mobile App (PWA - 10 Seconds)
The application is pre-configured with a standalone Web App Manifest, theme color (#1B4D3E), and official high-resolution MoTA app icons.

### On Android (Chrome / Brave / Edge / Samsung Internet):
1. Connect your phone to the same Wi-Fi and open Chrome.
2. Navigate to: **http://10.23.197.150:8081**
3. Tap the **three dots menu (⋮)** in the top right corner.
4. Select **\"Install App\"** or **\"Add to Home screen\"**.
5. Tap **\"Install\"**.
6. **Result**: The **MoTA ST Scholarships** app icon appears on your Android home screen and app drawer. It opens in **full screen standalone mode** with no browser URL bars or navigation buttons, looking and feeling like a native Android app!

### On iOS (Apple Safari):
1. Open Safari on your iPhone/iPad.
2. Navigate to: **http://10.23.197.150:8081**
3. Tap the **Share icon** (square with arrow pointing up).
4. Scroll down and tap **\"Add to Home Screen\"**.
5. Tap **\"Add\"**.
6. **Result**: Launches from your iOS home screen as an independent app.

---

## ⚡ Method 2: Live Native App via Expo Go (Android & iOS)
For native mobile performance, camera access, and gestures:
1. Install **Expo Go** from Google Play Store or Apple App Store.
2. Ensure your phone is connected to the same Wi-Fi network as this PC (10.23.197.150).
3. In Expo Go, tap **\"Enter URL manually\"**.
4. Type:
   `	ext
   exp://10.23.197.150:8081
   `
5. The application loads instantly with native mobile tab transitions, smooth gestures, and biometric-ready screens.

---

## 📦 Method 3: Build a Standalone Android APK (.apk file)
We have configured eas.json for generating installable APK binaries.

### Steps to generate your .apk:
1. Open terminal in d:/Tribal/mobile:
   `ash
   cd d:/Tribal/mobile
   `
2. Log into Expo (free account):
   `ash
   npx eas-cli login
   `
3. Run the APK build command:
   `ash
   npm run build:apk
   # or: npx eas-cli build -p android --profile preview
   `
4. Expo Application Services (EAS) will compile the Android APK in the cloud and output a direct download link (e.g., https://expo.dev/artifacts/eas/...mota-st-scholarships.apk).
5. Download the .apk on any Android device and tap **Install**!
