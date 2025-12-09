# Habit & Nutrition Tracker (SSR HBS + Node + MySQL)

A mobile-first, fully responsive Habit Tracker + Calorie & Nutrition Tracker built with:

- Node.js + TypeScript + Express
- express-handlebars (`.hbs`) for server-side views
- MySQL (or MariaDB) via Prisma ORM
- TailwindCSS for styling (CDN) + Chart.js
- JWT auth with httpOnly cookies

## Features (high-level)

- User auth (sign up / login / logout, password hashing)
- Dashboard with:
  - Today's habit completion summary, streak-friendly structure
  - Today's calories: goal, eaten, burned, remaining
  - Water intake, latest weight, macros overview
- Habit management:
  - Create / edit / archive habits
  - Boolean / numeric / duration types
  - Daily / weekly / monthly / custom frequencies
  - Quick logging (one-tap / steppers)
  - Logs + streak calculation & analytics endpoints
- Nutrition:
  - Generic + branded food models
  - Custom foods, recipes, saved meals (models in Prisma; routes easy to extend)
  - Daily food logging with meals, quantities, unit scaling
  - Macro & key micro tracking (fiber, sugar, sodium)
  - Net calories (goal − food + exercise)
- Logs:
  - Water, exercise, weight models + routes
- Journal:
  - Daily entries, tags, linking structure to habits via join table
- Profile / settings:
  - Height, weight, gender, activity level, goal type
  - Mifflin-St Jeor-based calorie goal with manual override
  - Macro goals, water goal
- Architecture ready for:
  - Barcode scanning (client hooks + barcode endpoint)
  - Voice/photo AI logging (easy to add endpoints)
  - Wearables (Apple/Google/Fitbit/Garmin) integration via `ExerciseLog` and additional sync services

---

## Prerequisites

- Node.js 18+
- npm or yarn
- MySQL or MariaDB instance

---

## Setup

1. **Clone repo and install dependencies**

   ```bash
   npm install
