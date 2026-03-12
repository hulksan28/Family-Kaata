# Family Kaata 💰

A shared family income & expense tracker. Every family member can log their incomes and expenses, and everyone can view a shared dashboard with visual analytics.

## Features

- 👤 **Family Profiles** — Add family members with emoji avatars (no passwords needed)
- 💸 **Income & Expense Tracking** — Log transactions with categories, amounts, and descriptions
- 📊 **Visual Dashboard** — Charts and metrics for spending patterns, category breakdowns, and member comparisons
- 🏷️ **Custom Categories** — 30+ default Indian categories + add your own
- 💱 **Multi-Currency** — Enter amounts in any currency, dashboard displays in INR
- 📱 **Mobile Friendly** — Fully responsive design

## Setup

1. Clone the repo
2. Run `npm install`
3. Create a `.env` file:
   ```
   MONGODB_URI=your_mongodb_connection_string
   PORT=3000
   ```
4. Run `npm start` (or `npm run dev` for development)
5. Open `http://localhost:3000`

## Deployment (Render)

1. Push to GitHub
2. Create a new **Web Service** on Render
3. Set **Build Command**: `npm install`
4. Set **Start Command**: `npm start`
5. Add environment variable: `MONGODB_URI`
