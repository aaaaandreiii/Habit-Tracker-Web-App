import { Router } from 'express';
import { requireAuth } from '../middleware/auth';
import { prisma } from '../lib/prisma';

const router = Router();

router.get('/settings', requireAuth, async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.currentUser!.id } });
  res.render('profile-settings', {
    layout: 'main',
    title: 'Profile & Goals',
    user: req.currentUser,
    profile: user,
  });
});

router.post('/settings', requireAuth, async (req, res) => {
  const {
    name,
    age,
    heightCm,
    weightKg,
    gender,
    activityLevel,
    goalType,
    calorieGoal,
    proteinGoalG,
    carbsGoalG,
    fatGoalG,
    waterGoalMl,
    unitsMetric,
  } = req.body;

  await prisma.user.update({
    where: { id: req.currentUser!.id },
    data: {
      name,
      age: age ? Number(age) : null,
      heightCm: heightCm ? Number(heightCm) : null,
      weightKg: weightKg ? Number(weightKg) : null,
      gender: gender || null,
      activityLevel: activityLevel || null,
      goalType: goalType || null,
      calorieGoal: calorieGoal ? Number(calorieGoal) : null,
      proteinGoalG: proteinGoalG ? Number(proteinGoalG) : null,
      carbsGoalG: carbsGoalG ? Number(carbsGoalG) : null,
      fatGoalG: fatGoalG ? Number(fatGoalG) : null,
      waterGoalMl: waterGoalMl ? Number(waterGoalMl) : null,
      unitsMetric: unitsMetric === 'on',
    },
  });

  res.redirect('/profile/settings');
});

export default router;
