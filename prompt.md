You are an expert full-stack engineer and UI/UX designer. Build a **fully responsive web application** (desktop + mobile friendly) that combines:

1. A **Habit Tracker**
2. A **Calorie & Nutrition Tracker**

Use a **modern JavaScript/TypeScript stack**, with:

* **Frontend**:

  * Server-side rendered **Handlebars (hbs)** templates as the primary view layer.
  * Views rendered via **Express** using the `hbs` (or `express-handlebars`) view engine.
  * Client-side interactivity using **vanilla JavaScript or TypeScript** (e.g. for charts, AJAX calls, and dynamic UI updates).
  * Mobile-first responsive layout with CSS (you may use TailwindCSS, Bootstrap, or another utility framework).

* **Backend**:

  * **Node.js + TypeScript + Express**.
  * RESTful routes that render hbs views and/or return JSON for client-side fetch requests.

* **Database**:

  * **MySQL** (or MariaDB) as the primary relational database, accessed via **Prisma, TypeORM, Knex, or another ORM/query builder**.
  * Use proper migrations and indexes to support analytics queries and fast lookups.

* **Charts**:

  * Chart.js, ECharts, Recharts (used via a small vanilla JS wrapper), or similar, embedded in hbs views via `<canvas>` elements and client-side JS.

Make sure the code is clean, modular, and well-commented.

At the end, provide:

* A clear **README** with setup, environment variables, and run instructions.
* Example **seed data** for development and demo purposes.

---

## GENERAL APP REQUIREMENTS

* The app must be **usable on both laptop and phone**:

  * Mobile-first, responsive design.
  * Touch-friendly buttons and controls.
* Implement basic **authentication** (sign up, log in, log out, password hashing, JWT or session-based).
* Use a clean dashboard-style layout:

  * **Main Dashboard** that shows:

    * Today’s habit summary (completed vs pending).
    * Today’s calories: goal, consumed, remaining.
    * Streak highlights, recent trends in habits & calories.
* Use a light and dark theme toggle (optional but preferred).

---

## DATA MODELS (HIGH LEVEL)

Design **MySQL database schemas / ORM models** for at least:

* `User`

  * id, email, passwordHash, name, age, height, weight, gender, activityLevel, goalType (loss/maintenance/gain), etc.
* `Habit`

  * id, userId, name, description, habitType (boolean/quantity/time/etc.), frequencyType (daily/weekly/custom), targetValue (optional), daysOfWeek or custom schedule, color/icon, isArchived, etc.
* `HabitLog`

  * id, habitId, date, status (completed/partial/missed), value (e.g., minutes, quantity), notes (short text), createdAt.
* `HabitGoal`

  * id, userId, habitId (nullable for global goals), goalType (shortTerm/longTerm), startDate, endDate, target (e.g., number of completions), description, currentProgress.
* `JournalEntry`

  * id, userId, date, title, content, tags (optional), relatedHabitIds (optional array or join table).
* `FoodItem` (for generic/global foods)

  * id, name, category, baseServingSize, calories, protein, carbs, fat, fiber, sugar, sodium, plus optional vitamins/minerals & metadata.
* `BrandedFoodItem` (for branded foods with barcodes)

  * id, brandName, productName, barcode, servingSize, nutrition fields like above, verified flag, source.
* `UserFoodEntry`

  * id, userId, dateTime, foodItemId or brandedFoodItemId or customFoodId, mealType (breakfast/lunch/dinner/snack), quantity, unit (g, oz, ml, cup, piece, etc.), computed calories, macros & micros.
* `CustomFood`

  * id, userId, name, servingSizeDescription, baseServingSizeAmount, baseServingSizeUnit, nutrition fields.
* `Recipe`

  * id, userId, name, description, instructions, numberOfServings, list of ingredient entries (each ingredient referencing FoodItem/BrandedFood/CustomFood + quantity/unit), and computed per-serving nutrition (use a join/child table).
* `WaterLog`

  * id, userId, dateTime, amount, unit (ml, oz, cups).
* `ExerciseLog`

  * id, userId, dateTime, exerciseType, durationMinutes, caloriesBurned, source (manual / Apple Health / Google Fit / Fitbit / Garmin / other).
* `WeightLog`

  * id, userId, date, weight, unit.

Use appropriate foreign keys, junction tables, and indexes (e.g., on `userId`, `date`, and search fields).

---

## FEATURE SET: HABIT TRACKER

### 1. Habit Creation & Customization

Implement UI (hbs templates + forms) and backend routes that allow users to:

* **Create, edit, delete, and archive habits**.
* Customize each habit with:

  * Name and optional description.
  * Type:

    * Binary (done/not done)
    * Numeric (e.g., “drink X glasses of water”, “read X pages”)
    * Duration (e.g., “exercise for X minutes”)
  * Frequency:

    * Daily
    * Weekly (choose days of week)
    * Monthly
    * Custom (e.g., X times per week, or custom date rules as feasible).
  * Start date and optional end date.
  * Optional category (health, productivity, learning, etc.).
  * Color/icon to visually distinguish habits.

Use Express routes to render the appropriate hbs views for creating and editing habits, plus JSON endpoints for any AJAX enhancements.

### 2. Quick Logging / Check-in

* On the **today** view (hbs template), show a list of habits with **one-tap / one-click logging**:

  * Binary habits: checkbox or toggle to mark as done.
  * Numeric habits: small stepper or slider (e.g., +1, +5) and quick presets.
  * Time-based habits: quick add minutes or mark as done when target reached.
* Allow logging for past days (e.g., last 30 days) and future planning if needed.

Support form-based submission and/or AJAX endpoints (JSON) that update logs and re-render parts of the page (e.g., via partials).

### 3. Visual Streak Tracking

* For each habit:

  * Display a **current streak** (consecutive days/weeks of completion).
  * Display the **longest streak**.
  * Use **visual cues** in hbs views (flame icon, highlighted dates, progress bar).
* Support a **“streak freeze” or grace rule** option:

  * E.g., optional setting where missing 1 day under certain conditions doesn’t completely break the streak.

### 4. Progress Visualization (Charts / Graphs / Heatmaps)

* Provide visualizations for habits including:

  * **Calendar Heatmap**:

    * A heatmap view (like GitHub activity) for a habit over a month/year showing intensity/completion. This can be rendered using hbs loops plus CSS, or via a client-side chart library.
  * **Daily / Weekly / Monthly Trends**:

    * Line or bar charts (using Chart.js or similar) showing:

      * Completion counts over time.
      * Average completion rate per week/month.
  * **Custom Time Range**:

    * Date range picker in the hbs UI to view progress over any custom period.

* Make it easy to spot **patterns and setbacks**:

  * Mark missed streak segments clearly.
  * Highlight trends like improving/declining completion rates.

### 5. Short-term & Long-term Habit Goals

* Allow users to define:

  * **Short-term goals** (e.g., “Complete my reading habit 20 times this month”).
  * **Long-term goals** (e.g., “Maintain at least 80% completion for this habit for 6 months”).
* Show:

  * Progress bars or percentages towards each goal.
  * Target dates and expected progress vs actual.

### 6. Journaling / Note-Taking

* Add a **Journal** section with:

  * Daily entries: one journal per day, with multiple sections or tags.
  * Ability to link a journal entry to specific habits or a day’s habit performance.
* On the habit detail page:

  * Show related journal entries or notes.
* Let users:

  * Add quick notes per day, per habit (e.g., small text field below the habit log).
  * Filter journal entries by habit, tag, or time period.

### 7. Additional Usability Features (for Habits)

* Habit templates (optional): quick presets like “Drink Water”, “Exercise”, “Read”.
* Reminders support (optional): placeholder functions / UI for reminders; you can simulate scheduling with local notifications or show how integration could work later.

---

## FEATURE SET: CALORIE & NUTRITION TRACKER

Design this to be comparable in power to top calorie tracking apps.

### 1. Massive, Verified Food Database

* Implement a structure in **MySQL** that can support **millions of food items**, both generic and branded.
* For the code sample:

  * Use a **modular data layer** that can be plugged into third-party APIs (e.g. USDA FoodData, Open Food Facts, etc.).
  * Include:

    * A sample **seed data set** with generic foods (chicken breast, rice, apple, etc.).
    * Sample branded foods with barcodes.
  * Add fields like `isVerified` and `source` to indicate trusted entries.
* Provide search endpoints and hbs-based UI that:

  * Support **search by name**, category, and brand.
  * Are optimized for fast lookup (add indexes in DB schemas).

### 2. Barcode Scanner

* On mobile:

  * Implement **client-side support** hooks for barcode scanning using the camera (e.g., via a JS library), or at least structure the UI and code to plug into such functionality later.
* When a barcode is scanned:

  * Look up the corresponding `BrandedFoodItem` by barcode in MySQL.
  * If found, show all nutrition info and allow one-tap logging.
  * If not found, prompt the user to create a new branded food item and save it.

### 3. Quick & Smart Logging

Implement **fast logging workflows**:

1. **Frequently Logged Foods**

   * Track frequently or recently logged foods per user.
   * On the add-food screen, show:

     * “Recent” and “Frequent” sections for one-tap entry.

2. **Meal Saving**

   * Allow users to save a group of food items as a named **Meal** (e.g., “Standard Breakfast”).
   * Users should be able to:

     * Log the whole meal in one tap for future days.
     * Edit a saved meal later.

3. **Voice or Photo Recognition (AI Integration Hooks)**

   * Provide endpoint placeholders and UI hooks for:

     * Voice logging such as “I ate 2 eggs and a slice of toast”.
     * Photo logging where a user uploads a meal photo.
   * For now:

     * Simulate the endpoint behavior or stub it out.
     * Clearly structure the code so AI recognition can be integrated later.

### 4. Custom Food & Recipe Creator

* **Custom Foods**:

  * Users can create their own foods with:

    * Name, serving size, units.
    * Full nutritional breakdown (calories, macros, and important micros).
* **Recipes**:

  * Users can build recipes by:

    * Adding multiple ingredients (from any food source: generic, branded, or custom).
    * Setting quantities and units.
  * App should:

    * Calculate total nutrition for the entire recipe.
    * Let the user specify number of servings.
    * Automatically compute **per-serving macros & micros**.

### 5. Flexible Serving Sizes

* When logging foods, users must be able to choose:

  * **Units**: grams, ounces, milliliters, cups, pieces, etc.
  * Standard serving sizes (e.g., “1 large apple”, “1 cup cooked rice”, “1 slice bread”).
* Implement conversion logic:

  * Base all nutrition on a default 100g / 1 serving entry, then scale by chosen unit and quantity.

### 6. Goal Customization (Calories)

* When a user signs up or updates profile:

  * Store current **weight, height, age, gender, activity level**.
  * Ask for **goal**: lose weight, maintain, gain.
* Implement:

  * A function to calculate **daily calorie target** (TDEE-based or using Mifflin-St Jeor; document which you choose).
  * **User override**: users must be able to customize their calorie goal manually.
* Store:

  * Daily / weekly calorie goals.
  * Optional macro ratio goals (e.g., 40/30/30).

### 7. Macronutrient Tracking (Macros)

* Track and display for each day and each meal:

  * **Total Calories**
  * **Protein**
  * **Carbohydrates**
  * **Fat**
* Allow users to set:

  * **Custom macro goals**:

    * By grams (e.g., 150g protein) or
    * By percentages of total calories.
* In the UI (hbs templates):

  * Show macro progress bars:

    * For example, protein consumed vs target, carbs vs target, fats vs target.

### 8. Micronutrient Tracking (Details)

* Track key micronutrients where possible:

  * Fiber
  * Sugar
  * Sodium
  * Other vitamins/minerals as fields in the food database (at least a few common ones).
* In the daily summary:

  * Show totals for these micronutrients.
  * Indicate if they are within or exceeding recommended ranges (hardcode example reference ranges or allow customization).

### 9. Net Calories Display

* Implement the **Net Calories** formula:

  **Calories Remaining = Calorie Goal − Food Calories + Exercise Calories Burned**

* For each day:

  * Display:

    * Calorie goal
    * Calories eaten
    * Calories burned from exercise
    * **Net calories**
    * **Remaining calories** for the day

* Show this clearly on the daily overview and main dashboard (via hbs views and charts).

### 10. Integration & Data Visualization

#### a) Fitness Tracker / Wearable Integration

* Architect the backend to support syncing with:

  * Apple Health
  * Google Fit
  * Fitbit
  * Garmin
* For now:

  * Implement integration points as separate modules/services, e.g., `AppleHealthService`, `GoogleFitService`, etc., with placeholder methods.
  * Simulate sample data from these services with mock APIs or seed data.
* Map imported exercise sessions (calories burned, steps, etc.) into the `ExerciseLog` model.

#### b) Water Tracking

* Provide a simple UI component in hbs for **logging water intake**:

  * Quick buttons: +250 ml, +500 ml, +1 cup, etc.
  * Ability to undo or edit entries.
* Display:

  * A daily water target (user configurable).
  * A progress bar or bottle graphic showing how much they’ve drunk vs goal.

#### c) Progress Charts

* Implement charts to visualize:

  1. **Weight Over Time**

     * Line chart of weight vs date.
     * Optional overlay of calorie trend.

  2. **Calorie & Macro Intake Trends**

     * Daily bar/line charts showing:

       * Total calories per day.
       * Protein / carbs / fats per day.
     * Weekly and monthly summary views highlighting averages and consistency.

* Provide:

  * Date range filters (last 7 days, last 30 days, custom range).
  * Hover tooltips showing exact values.

---

## UI/UX FLOW

### Main Sections

Implement these main sections with navigation (e.g., navbar rendered via an hbs layout and partials):

1. **Dashboard**

   * Today’s habits (with quick logging).
   * Today’s calories summary and macros.
   * Current streaks and quick stats.
   * Buttons to jump to detailed Habit or Nutrition views.

2. **Habits**

   * Subsections:

     * “Today” view with quick logging.
     * “Calendar / Heatmap” view.
     * “Goals & Progress” view.
   * Habit detail pages:

     * Settings (frequency, type, schedule).
     * Streak visualizations.
     * Charts & history.
     * Linked journal entries.

3. **Nutrition**

   * Daily log view:

     * Meals listed (breakfast, lunch, dinner, snacks).
     * Add food by:

       * Search
       * Barcode
       * Saved meals
       * Custom food / recipes
     * Show daily totals: calories, macros, key micros.
   * Recipe & Custom Food management pages.
   * Progress tab:

     * Weight chart
     * Calorie/macros trends
     * Net calories overview across time.

4. **Journal**

   * List view of entries with search / filter (by date, tag, related habit).
   * Entry detail page: date, content, related habits.

5. **Profile / Settings**

   * Personal data (height, weight, age, etc.).
   * Goals (weight goal, calorie target, macro targets).
   * Integration settings (placeholder toggles for Apple Health, etc.).
   * Units preferences (metric/imperial).

---

## TECHNICAL REQUIREMENTS

* Use a **RESTful API** (or GraphQL if you prefer, but document it clearly).

* Implement:

  * Proper error handling.
  * Input validation (server-side and client-side).
  * Secure password handling and auth (e.g., bcrypt + JWT, or session + cookies).

* Organize the project with a clear folder structure, for example:

  * `/server` for the **Express backend**, **hbs views**, and API routes.

    * e.g., `/server/src/routes`, `/server/src/controllers`, `/server/src/services`, `/server/views`, `/server/public`.
  * `/client` (optional) for additional frontend assets (e.g., TypeScript/JS bundles, CSS, build tooling) if you want a build step for static assets.
  * `/prisma` or `/migrations` (or equivalent) for MySQL migrations and schema management.

* Use layout and partials in hbs (e.g., navbar, footers, habit cards, food list items) for reusability.

* Include example `.env.example` file listing required environment variables (MySQL connection URL, JWT secret, session secret, etc.).

---

## OUTPUT FORMAT

1. Provide an overview of the architecture and chosen technologies (Express + hbs + MySQL + ORM, etc.).
2. Show the main **MySQL schema or ORM models**.
3. Provide backend code for:

   * Auth routes (sign up, login, logout, session/JWT handling).
   * Habit endpoints (CRUD, logging, progress data).
   * Nutrition endpoints (food search, logging, custom food/recipes, summary, charts data).
   * Water, exercise, and weight logging.
4. Provide frontend code for:

   * **hbs templates/views** described above (layouts, pages, partials).
   * Client-side JS/TS for charts, quick logging, form enhancements, and dynamic components.
5. Include clearly labeled code blocks with file paths, e.g.:

   * `server/src/routes/habits.ts`
   * `server/src/routes/auth.ts`
   * `server/views/layouts/main.hbs`
   * `server/views/dashboard.hbs`
   * `server/public/js/dashboard.ts`
6. Include a **README** with step-by-step instructions to run the app locally (including MySQL setup, migrations, seeding, and how to access the app on both desktop and mobile browsers on the same network).

Build everything as a coherent, working example that I can run locally to use the habit tracker and calorie tracker on both my laptop and my phone via the browser, using **hbs for the frontend** and **MySQL as the database**.
