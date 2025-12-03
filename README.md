<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/drive/15n7Zp4l15l7EoJ3nSiSfl4Le6iC8_TQs

## Run Locally

**Prerequisites:** Node.js

1. Install dependencies:
   ```bash
   npm install
   ```

2. Setup Firebase configuration:
   - Copy `firebase.example.ts` to `firebase.ts`:
     ```bash
     cp firebase.example.ts firebase.ts
     ```
   - Open `firebase.ts` and replace the placeholder values with your Firebase project credentials
   - Get your Firebase config from [Firebase Console](https://console.firebase.google.com/) → Project Settings → Your apps

3. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key (if needed)

4. Run the app:
   ```bash
   npm run dev
   ```

## Firebase Setup (برای استفاده از چند دستگاه)

این اپلیکیشن از Firestore برای ذخیره پیشرفت کاربر استفاده می‌کند. برای استفاده از چند دستگاه:

### 1. تنظیم Firestore Security Rules

به [Firebase Console](https://console.firebase.google.com/) بروید و پروژه `seeband-d9543` را انتخاب کنید.

سپس به **Firestore Database** → **Rules** بروید و قوانین زیر را تنظیم کنید:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      // اجازه خواندن و نوشتن برای همه (برای استفاده آسان)
      allow read, write: if true;

      // یا برای امنیت بیشتر (اختیاری):
      // allow read, write: if request.auth != null;
    }
  }
}
```

### 2. استفاده از چند دستگاه

- شناسه کاربر در `localStorage` ذخیره می‌شود
- برای استفاده از همان داده‌ها در دستگاه دیگر، شناسه کاربر را کپی کنید
- یا از همان مرورگر/حساب استفاده کنید تا شناسه یکسان بماند

**نکته:** داده‌ها به صورت Real-time از Firestore لود می‌شوند و در همه دستگاه‌ها همگام‌سازی می‌شوند.
