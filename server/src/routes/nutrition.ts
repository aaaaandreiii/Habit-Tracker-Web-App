// server/src/routes/nutrition.ts
import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';
import { MealType, Unit } from '@prisma/client';
import { startOfDay } from 'date-fns';
import { getDailyNutritionSummary, scaleNutrition } from '../services/nutritionService';
import { format } from 'date-fns';

const router = Router();

/* Daily log view */
router.get('/daily', requireAuth, async (req, res) => {
  const userId = req.currentUser!.id;
  const today = new Date();
  const start = startOfDay(today);
  const end = new Date(start.getTime() + 86400000);

  const [entries, summary] = await Promise.all([
    prisma.userFoodEntry.findMany({
      where: { userId, dateTime: { gte: start, lt: end } },
      include: { foodItem: true, brandedFoodItem: true, customFood: true, recipe: true },
      orderBy: { dateTime: 'asc' },
    }),
    getDailyNutritionSummary(userId, today),
  ]);

  res.render('nutrition-daily', {
    layout: 'main',
    title: 'Daily Nutrition',
    user: req.currentUser,
    entries,
    summary,
    mealTypes: Object.values(MealType),
  });
});

/* Progress / trends view (weight + calories trend) */
router.get('/progress', requireAuth, async (req, res) => {
  const userId = req.currentUser!.id;
  const summary = await getDailyNutritionSummary(userId, new Date());

  res.render('nutrition-progress', {
    layout: 'main',
    title: 'Progress',
    user: req.currentUser,
    summary,
  });
});

/* Food search (hbs view or JSON) */
router.get('/foods/search', requireAuth, async (req, res) => {
  const userId = req.currentUser!.id;
  const q = (req.query.q as string) || '';
  const limit = 20;

  const [generic, branded, customFoods, recentEntries] = await Promise.all([
    prisma.foodItem.findMany({
      where: q ? { name: { contains: q } } : {},
      take: limit,
    }),
    prisma.brandedFoodItem.findMany({
      where: q
        ? {
            OR: [
              { productName: { contains: q } },
              { brandName: { contains: q } },
            ],
          }
        : {},
      take: limit,
    }),
    prisma.customFood.findMany({
      where: {
        userId,
        ...(q ? { name: { contains: q } } : {}),
      },
      take: limit,
    }),
    prisma.userFoodEntry.findMany({
      where: { userId },
      orderBy: { dateTime: 'desc' },
      take: 10,
      include: {
        foodItem: true,
        brandedFoodItem: true,
        customFood: true,
        recipe: true,
      },
    }),
  ]);

  if (req.headers.accept?.includes('application/json')) {
    return res.json({ generic, branded, customFoods, recentEntries });
  }

  res.render('nutrition-search', {
    layout: 'main',
    title: 'Search Foods',
    user: req.currentUser,
    q,
    generic,
    branded,
    customFoods,
    recentEntries,
  });
});

/* Create a custom food from the search page */
router.post('/foods/custom', requireAuth, async (req, res) => {
  const userId = req.currentUser!.id;
  const {
    name,
    servingSizeDesc,
    baseServingSizeAmount,
    baseServingSizeUnit,
    calories,
    protein,
    carbs,
    fat,
    fiber,
    sugar,
    sodium,
  } = req.body;

  if (!name || !calories) {
    return res.redirect('/nutrition/foods/search');
  }

  await prisma.customFood.create({
    data: {
      userId,
      name,
      servingSizeDesc,
      baseServingSizeAmount: baseServingSizeAmount
        ? Number(baseServingSizeAmount)
        : 100,
      baseServingSizeUnit: (baseServingSizeUnit as Unit) || Unit.G,
      calories: Number(calories),
      protein: protein ? Number(protein) : 0,
      carbs: carbs ? Number(carbs) : 0,
      fat: fat ? Number(fat) : 0,
      fiber: fiber ? Number(fiber) : 0,
      sugar: sugar ? Number(sugar) : 0,
      sodium: sodium ? Number(sodium) : 0,
    },
  });

  res.redirect(`/nutrition/foods/search?q=${encodeURIComponent(name)}`);
});

/* Barcode lookup (mobile hook) */
router.get('/foods/barcode/:code', requireAuth, async (req, res) => {
  const { code } = req.params;
  const food = await prisma.brandedFoodItem.findUnique({ where: { barcode: code } });
  if (!food) {
    return res.status(404).json({ found: false });
  }
  res.json({ found: true, food });
});

/* Log a food entry */
router.post('/log', requireAuth, async (req, res) => {
  const userId = req.currentUser!.id;
  const {
    mealType,
    foodItemId,
    brandedFoodItemId,
    customFoodId,
    recipeId,
    quantity,
    unit,
  } = req.body;

  const dateTime = new Date();

  let baseFood: any = null;
  let baseAmount = 100;

  if (foodItemId) {
    baseFood = await prisma.foodItem.findUnique({ where: { id: Number(foodItemId) } });
    baseAmount = baseFood.baseServingSizeG;
  } else if (brandedFoodItemId) {
    baseFood = await prisma.brandedFoodItem.findUnique({
      where: { id: Number(brandedFoodItemId) },
    });
    baseAmount = baseFood.servingSizeG;
  } else if (customFoodId) {
    baseFood = await prisma.customFood.findUnique({ where: { id: Number(customFoodId) } });
    baseAmount = baseFood.baseServingSizeAmount;
  } else if (recipeId) {
    baseFood = await prisma.recipe.findUnique({ where: { id: Number(recipeId) } });
    baseAmount = 1; // per serving
  }

  const qty = Number(quantity || 1);
  const u = (unit as Unit) || 'G';

  const scaled = scaleNutrition(
    {
      calories: baseFood.calories,
      protein: baseFood.protein,
      carbs: baseFood.carbs,
      fat: baseFood.fat,
      fiber: baseFood.fiber,
      sugar: baseFood.sugar,
      sodium: baseFood.sodium,
    },
    baseAmount,
    qty,
    u
  );

  await prisma.userFoodEntry.create({
    data: {
      userId,
      dateTime,
      mealType,
      foodItemId: foodItemId ? Number(foodItemId) : null,
      brandedFoodItemId: brandedFoodItemId ? Number(brandedFoodItemId) : null,
      customFoodId: customFoodId ? Number(customFoodId) : null,
      recipeId: recipeId ? Number(recipeId) : null,
      quantity: qty,
      unit: u,
      calories: scaled.calories,
      protein: scaled.protein,
      carbs: scaled.carbs,
      fat: scaled.fat,
      fiber: scaled.fiber,
      sugar: scaled.sugar,
      sodium: scaled.sodium,
    },
  });

  res.redirect('/nutrition/daily');
});

/* Water logging (quick buttons) */
router.post('/water', requireAuth, async (req, res) => {
  const { amount, unit } = req.body;
  await prisma.waterLog.create({
    data: {
      userId: req.currentUser!.id,
      amount: Number(amount),
      unit: unit || 'ML',
      dateTime: new Date(),
    },
  });

  if (req.headers.accept?.includes('application/json')) {
    return res.json({ success: true });
  }
  res.redirect('/dashboard');
});

/* Exercise logging (manual) */
router.post('/exercise', requireAuth, async (req, res) => {
  const { exerciseType, durationMin, caloriesBurned } = req.body;
  await prisma.exerciseLog.create({
    data: {
      userId: req.currentUser!.id,
      exerciseType,
      durationMin: Number(durationMin),
      caloriesBurned: Number(caloriesBurned),
      dateTime: new Date(),
      source: 'MANUAL',
    },
  });
  res.redirect('/dashboard');
});

/* Weight logging */
router.post('/weight', requireAuth, async (req, res) => {
  const { weightKg, date } = req.body;
  await prisma.weightLog.create({
    data: {
      userId: req.currentUser!.id,
      weightKg: Number(weightKg),
      date: date ? new Date(date) : new Date(),
    },
  });
  res.redirect('/nutrition/progress');
});

/* Calorie & weight trends for Chart.js */
router.get('/api/trends', requireAuth, async (req, res) => {
  const userId = req.currentUser!.id;
  const now = new Date();
  const from = new Date(now.getTime() - 29 * 86400000);

  const entriesRaw = await prisma.userFoodEntry.findMany({
    where: { userId, dateTime: { gte: from, lte: now } },
    select: { dateTime: true, calories: true },
    orderBy: { dateTime: 'asc' },
  });

  const byDay: Record<string, number> = {};
  for (const e of entriesRaw) {
    const key = format(startOfDay(e.dateTime), 'yyyy-MM-dd');
    byDay[key] = (byDay[key] ?? 0) + e.calories;
  }

  const entries = Object.entries(byDay).map(([date, calories]) => ({
    date,
    calories,
  }));

  const weights = await prisma.weightLog.findMany({
    where: { userId, date: { gte: from, lte: now } },
    orderBy: { date: 'asc' },
  });

  res.json({ entries, weights });
});

export default router;
