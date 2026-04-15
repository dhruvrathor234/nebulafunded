<div align="center">
<img width="1200" height="475" alt="GHBanner" src="https://github.com/user-attachments/assets/0aa67016-6eaf-458a-adb2-6e31a0763ed6" />
</div>

# Run and deploy your AI Studio app

This contains everything you need to run your app locally.

View your app in AI Studio: https://ai.studio/apps/ffa47564-ffbe-4e05-a42c-343eee8ae5ed

## Run Locally

**Prerequisites:**  Node.js


1. Install dependencies:
   `npm install`
2. Set the `GEMINI_API_KEY` in [.env.local](.env.local) to your Gemini API key
3. Run the app:
   `npm run dev`

## Razorpay On Vercel

This project now uses Vercel Serverless Functions for Razorpay:

- `api/payment/order.ts`
- `api/payment/verify.ts`

Set these environment variables in Vercel Project Settings -> Environment Variables:

- `RAZORPAY_KEY_ID`
- `RAZORPAY_KEY_SECRET`
- `VITE_RAZORPAY_KEY_ID` (same value as `RAZORPAY_KEY_ID`)

After setting variables, redeploy the project.

Notes:

- Do not store secrets in frontend code.
- `server.ts` can still be used for local development, but Vercel production requests to `/api/payment/*` are handled by the files inside `api/`.
