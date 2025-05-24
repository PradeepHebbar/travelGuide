# 🧭 Travel Guide App

A full-stack travel discovery application that helps users explore destinations and en route attractions in India.

---

## 🚀 Overview

- **Frontend**: React Native (Expo) with [expo-router]
- **Backend**: Node.js + Express
- **Database**: PostgreSQL
- **Location Data**: Google Maps APIs & Wikipedia

This guide walks you through setting up and running the project on a new machine.

---

## 🔧 Prerequisites

| Tool               | Recommended Version | Installation                    |
| ------------------ | ------------------- | ------------------------------- |
| Node.js            | 18.18.x (LTS)       | [Download & install][node]      |
| npm                | 9.x or later        | Bundled with Node.js            |
| **nvm** (optional) | any                 | [nvm installation][nvm]         |
| PostgreSQL         | 15.x or later       | [Download & install][postgres]  |
| Expo CLI           | ^7.0.0              | `npm install -g expo-cli`       |
| Git                | any stable version  | via `apt`, `brew`, or installer |

---

## 📥 1. Clone the Repository

```bash
git clone https://github.com/<your-username>/travel-guide-app.git
cd travel-guide-app
```

---

## 🗄️ 2. PostgreSQL Setup

1. Start your PostgreSQL service.
2. Create the database and tables:

   ```sql
   CREATE DATABASE travel_guide;
   \c travel_guide

   CREATE TABLE "ExploreDestinationPlaces" (
     place_id TEXT PRIMARY KEY,
     place_name TEXT NOT NULL
   );

   CREATE TABLE "ExploreDestinationPlacesDetails" (
     place_place_id TEXT PRIMARY KEY,
     place_id TEXT REFERENCES "ExploreDestinationPlaces"(place_id) ON DELETE CASCADE,
     place_name TEXT,
     description TEXT,
     address TEXT,
     business_status TEXT,
     ratings FLOAT,
     type TEXT[],
     total_user_rating INT,
     timing TEXT[],
     ph_number TEXT,
     website TEXT,
     photo_url TEXT
   );
   ```

---

## ⚙️ 3. Backend Setup

```bash
cd backend
npm install
```

1. Copy and edit the sample config:

   ```bash
   cp config.example.js config.js
   ```

2. In `config.json`, set:

   - `GOOGLE_MAPS_API_KEY` (your Google Places API key)
   - PostgreSQL credentials (`user`, `host`, `database`, `password`, `port`)
   - `USE_CACHE` (`true` or `false`)

3. Start the server:

   ```bash
   npm run start
   # or\   node index.js
   ```

> The backend listens at `http://localhost:3000` by default.

---

## 📱 4. Frontend Setup (Expo)

```bash
cd app
npm install
```

1. In `backend/constants/config.ts` (shared):

   ```ts
   export const BASE_URL = "http://<YOUR_MACHINE_IP>:3000";
   export const GOOGLE_MAPS_API_KEY = "<YOUR_API_KEY>";
   ```

2. Launch Expo:

   ```bash
   npx expo start
   ```

3. On a device:

   - **iOS**: Install **Expo Go** from the App Store and scan the QR code.
   - **Android**: Install **Expo Go** from Play Store and scan the QR code.

> Ensure your device and dev machine are on the same LAN.

---

## 🔄 5. Useful Commands

- **Clear Metro Cache**:

  ```bash
  npx expo start -c
  ```

- **Get local IP (macOS)**:

  ```bash
  ipconfig getifaddr en0
  ```

- **Upgrade Expo SDK**:

  ```bash
  npx expo upgrade
  ```

---

## 🛠️ 6. Troubleshooting

1. **SDK Mismatch**: run `expo upgrade` to align versions.
2. **Network Errors**: use LAN IP in `BASE_URL`, disable VPN/firewalls.
3. **Headers Sent Error**: restart backend after code changes.
4. **Dependency Conflicts**: `npm install --legacy-peer-deps` or align `react`/`react-native` versions.

---

🎉 You’re all set—happy coding and exploring! 🌏

[node]: https://nodejs.org/
[nvm]: https://github.com/nvm-sh/nvm#install--update-script
[postgres]: https://www.postgresql.org/download/
[expo-router]: https://expo.github.io/router/docs
