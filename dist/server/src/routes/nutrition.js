"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/routes/nutrition.ts
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const nutritionService_1 = require("../services/nutritionService");
const date_fns_2 = require("date-fns");
const router = (0, express_1.Router)();
/* Daily log view */
router.get('/daily', auth_1.requireAuth, async (req, res) => {
    const userId = req.currentUser.id;
    const today = new Date();
    const start = (0, date_fns_1.startOfDay)(today);
    const end = new Date(start.getTime() + 86400000);
    const [entries, summary] = await Promise.all([
        prisma_1.prisma.userFoodEntry.findMany({
            where: { userId, dateTime: { gte: start, lt: end } },
            include: { foodItem: true, brandedFoodItem: true, customFood: true, recipe: true },
            orderBy: { dateTime: 'asc' },
        }),
        (0, nutritionService_1.getDailyNutritionSummary)(userId, today),
    ]);
    res.render('nutrition-daily', {
        layout: 'main',
        title: 'Daily Nutrition',
        user: req.currentUser,
        entries,
        summary,
        mealTypes: Object.values(client_1.MealType),
    });
});
/* Progress / trends view (weight + calories trend) */
router.get('/progress', auth_1.requireAuth, async (req, res) => {
    const userId = req.currentUser.id;
    const summary = await (0, nutritionService_1.getDailyNutritionSummary)(userId, new Date());
    res.render('nutrition-progress', {
        layout: 'main',
        title: 'Progress',
        user: req.currentUser,
        summary,
    });
});
/* Food search (hbs view or JSON) */
router.get('/foods/search', auth_1.requireAuth, async (req, res) => {
    const q = req.query.q || '';
    const limit = 20;
    const [generic, branded] = await Promise.all([
        prisma_1.prisma.foodItem.findMany({
            where: { name: { contains: q } },
            take: limit,
        }),
        prisma_1.prisma.brandedFoodItem.findMany({
            where: {
                OR: [
                    { productName: { contains: q } },
                    { brandName: { contains: q } },
                ],
            },
            take: limit,
        }),
    ]);
    if (req.headers.accept?.includes('application/json')) {
        return res.json({ generic, branded });
    }
    res.render('nutrition-search', {
        layout: 'main',
        title: 'Search Foods',
        user: req.currentUser,
        q,
        generic,
        branded,
    });
});
/* Barcode lookup (mobile hook) */
router.get('/foods/barcode/:code', auth_1.requireAuth, async (req, res) => {
    const { code } = req.params;
    const food = await prisma_1.prisma.brandedFoodItem.findUnique({ where: { barcode: code } });
    if (!food) {
        return res.status(404).json({ found: false });
    }
    res.json({ found: true, food });
});
/* Log a food entry */
router.post('/log', auth_1.requireAuth, async (req, res) => {
    const userId = req.currentUser.id;
    const { mealType, foodItemId, brandedFoodItemId, customFoodId, recipeId, quantity, unit, } = req.body;
    const dateTime = new Date();
    let baseFood = null;
    let baseAmount = 100;
    if (foodItemId) {
        baseFood = await prisma_1.prisma.foodItem.findUnique({ where: { id: Number(foodItemId) } });
        baseAmount = baseFood.baseServingSizeG;
    }
    else if (brandedFoodItemId) {
        baseFood = await prisma_1.prisma.brandedFoodItem.findUnique({
            where: { id: Number(brandedFoodItemId) },
        });
        baseAmount = baseFood.servingSizeG;
    }
    else if (customFoodId) {
        baseFood = await prisma_1.prisma.customFood.findUnique({ where: { id: Number(customFoodId) } });
        baseAmount = baseFood.baseServingSizeAmount;
    }
    else if (recipeId) {
        baseFood = await prisma_1.prisma.recipe.findUnique({ where: { id: Number(recipeId) } });
        baseAmount = 1; // per serving
    }
    const qty = Number(quantity || 1);
    const u = unit || 'G';
    const scaled = (0, nutritionService_1.scaleNutrition)({
        calories: baseFood.calories,
        protein: baseFood.protein,
        carbs: baseFood.carbs,
        fat: baseFood.fat,
        fiber: baseFood.fiber,
        sugar: baseFood.sugar,
        sodium: baseFood.sodium,
    }, baseAmount, qty, u);
    await prisma_1.prisma.userFoodEntry.create({
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
router.post('/water', auth_1.requireAuth, async (req, res) => {
    const { amount, unit } = req.body;
    await prisma_1.prisma.waterLog.create({
        data: {
            userId: req.currentUser.id,
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
router.post('/exercise', auth_1.requireAuth, async (req, res) => {
    const { exerciseType, durationMin, caloriesBurned } = req.body;
    await prisma_1.prisma.exerciseLog.create({
        data: {
            userId: req.currentUser.id,
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
router.post('/weight', auth_1.requireAuth, async (req, res) => {
    const { weightKg, date } = req.body;
    await prisma_1.prisma.weightLog.create({
        data: {
            userId: req.currentUser.id,
            weightKg: Number(weightKg),
            date: date ? new Date(date) : new Date(),
        },
    });
    res.redirect('/nutrition/progress');
});
/* Calorie & weight trends for Chart.js */
router.get('/api/trends', auth_1.requireAuth, async (req, res) => {
    const userId = req.currentUser.id;
    const now = new Date();
    const from = new Date(now.getTime() - 29 * 86400000);
    const entriesRaw = await prisma_1.prisma.userFoodEntry.findMany({
        where: { userId, dateTime: { gte: from, lte: now } },
        select: { dateTime: true, calories: true },
        orderBy: { dateTime: 'asc' },
    });
    const byDay = {};
    for (const e of entriesRaw) {
        const key = (0, date_fns_2.format)((0, date_fns_1.startOfDay)(e.dateTime), 'yyyy-MM-dd');
        byDay[key] = (byDay[key] ?? 0) + e.calories;
    }
    const entries = Object.entries(byDay).map(([date, calories]) => ({
        date,
        calories,
    }));
    const weights = await prisma_1.prisma.weightLog.findMany({
        where: { userId, date: { gte: from, lte: now } },
        orderBy: { date: 'asc' },
    });
    res.json({ entries, weights });
});
exports.default = router;
