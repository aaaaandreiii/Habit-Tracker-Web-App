import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { getTodayHabits } from '../services/habitService';
import { getDailyNutritionSummary } from '../services/nutritionService';
import { prisma } from '../lib/prisma';
import { startOfDay } from 'date-fns';

const router = Router();

router.get('/', requireAuth, async (req, res) => {
  const userId = req.currentUser!.id;
  const today = new Date();

  const [habits, nutrition, waterToday, weightLatest, userProfile] = await Promise.all([
    getTodayHabits(userId, today),
    getDailyNutritionSummary(userId, today),
    prisma.waterLog.aggregate({
      _sum: { amount: true },
      where: {
        userId,
        dateTime: {
          gte: startOfDay(today),
          lt: new Date(startOfDay(today).getTime() + 86400000),
        },
      },
    }),
    prisma.weightLog.findFirst({
      where: { userId },
      orderBy: { date: 'desc' },
    }),
    prisma.user.findUnique({
      where: { id: userId },
      select: { waterGoalMl: true },
    }),
  ]);

  const completed = habits.filter((h) =>
    h.logs.some((l) => l.status === 'COMPLETED')
  ).length;
  const totalHabits = habits.length;

  res.render('dashboard', {
    layout: 'main',
    title: 'Dashboard',
    user: req.currentUser,
    habits,
    habitSummary: { completed, total: totalHabits },
    nutrition,
    waterTotalMl: waterToday._sum.amount ?? 0,
    waterGoalMl: userProfile?.waterGoalMl ?? 2000,
    weightLatest,
  });
});

/* JSON API for charts */
router.get('/api/summary', requireAuth, async (req, res) => {
  const userId = req.currentUser!.id;
  const summary = await getDailyNutritionSummary(userId, new Date());
  res.json(summary);
});

export default router;
