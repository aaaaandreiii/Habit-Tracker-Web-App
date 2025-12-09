"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const habitService_1 = require("../services/habitService");
const nutritionService_1 = require("../services/nutritionService");
const prisma_1 = require("../lib/prisma");
const date_fns_1 = require("date-fns");
const router = (0, express_1.Router)();
router.get('/', auth_1.requireAuth, async (req, res) => {
    const userId = req.currentUser.id;
    const today = new Date();
    const [habits, nutrition, waterToday, weightLatest] = await Promise.all([
        (0, habitService_1.getTodayHabits)(userId, today),
        (0, nutritionService_1.getDailyNutritionSummary)(userId, today),
        prisma_1.prisma.waterLog.aggregate({
            _sum: { amount: true },
            where: {
                userId,
                dateTime: { gte: (0, date_fns_1.startOfDay)(today), lt: new Date((0, date_fns_1.startOfDay)(today).getTime() + 86400000) },
            },
        }),
        prisma_1.prisma.weightLog.findFirst({
            where: { userId },
            orderBy: { date: 'desc' },
        }),
    ]);
    const completed = habits.filter((h) => h.logs.some((l) => l.status === 'COMPLETED')).length;
    const totalHabits = habits.length;
    res.render('dashboard', {
        layout: 'main',
        title: 'Dashboard',
        user: req.currentUser,
        habits,
        habitSummary: { completed, total: totalHabits },
        nutrition,
        waterTotalMl: waterToday._sum.amount ?? 0,
        weightLatest,
    });
});
/* JSON API for charts */
router.get('/api/summary', auth_1.requireAuth, async (req, res) => {
    const userId = req.currentUser.id;
    const summary = await (0, nutritionService_1.getDailyNutritionSummary)(userId, new Date());
    res.json(summary);
});
exports.default = router;
