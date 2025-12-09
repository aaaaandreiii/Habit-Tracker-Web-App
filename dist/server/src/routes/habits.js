"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// server/src/routes/habits.ts
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const habitService_1 = require("../services/habitService");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const router = (0, express_1.Router)();
/* Today view with quick logging */
router.get('/today', auth_1.requireAuth, async (req, res) => {
    const habits = await (0, habitService_1.getTodayHabits)(req.currentUser.id);
    res.render('habits-today', {
        layout: 'main',
        title: "Today's Habits",
        user: req.currentUser,
        habits,
    });
});
/* Habit creation form */
router.get('/new', auth_1.requireAuth, (req, res) => {
    res.render('habits-edit', {
        layout: 'main',
        title: 'New Habit',
        user: req.currentUser,
        habit: null,
    });
});
router.post('/new', auth_1.requireAuth, async (req, res) => {
    const userId = req.currentUser.id;
    const { name, description, habitType, frequencyType, targetValue, startDate, endDate, category, color, icon, noEndDate, } = req.body;
    await prisma_1.prisma.habit.create({
        data: {
            userId,
            name,
            description,
            habitType,
            frequencyType,
            targetValue: targetValue ? Number(targetValue) : null,
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: noEndDate === 'on' || !endDate ? null : new Date(endDate),
            category,
            color,
            icon,
        },
    });
    res.redirect('/habits/today');
});
/* Edit habit */
router.get('/:id/edit', auth_1.requireAuth, async (req, res) => {
    const habitId = Number(req.params.id);
    const habit = await prisma_1.prisma.habit.findFirst({
        where: { id: habitId, userId: req.currentUser.id },
    });
    if (!habit)
        return res.redirect('/habits/today');
    res.render('habits-edit', {
        layout: 'main',
        title: 'Edit Habit',
        user: req.currentUser,
        habit,
    });
});

router.post('/:id/edit', auth_1.requireAuth, async (req, res) => {
    const habitId = Number(req.params.id);
    const { name, description, habitType, frequencyType, targetValue, startDate, endDate, category, color, icon, isArchived, noEndDate, } = req.body;
    await prisma_1.prisma.habit.update({
        where: { id: habitId },
        data: {
            name,
            description,
            habitType,
            frequencyType,
            targetValue: targetValue ? Number(targetValue) : null,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: noEndDate === 'on'
                ? null
                : endDate
                    ? new Date(endDate)
                    : undefined, // leave as is if not provided
            category,
            color,
            icon,
            isArchived: Boolean(isArchived),
        },
    });
    res.redirect('/habits/today');
});
/* Quick log endpoint (AJAX) */
router.post('/:id/log', auth_1.requireAuth, async (req, res) => {
    const habitId = Number(req.params.id);
    const { status, value, notes, date } = req.body;
    const parsedDate = date ? (0, date_fns_1.parseISO)(date) : new Date();
    const log = await (0, habitService_1.logHabit)({
        habitId,
        date: parsedDate,
        status: status,
        value: value ? Number(value) : undefined,
        notes,
    });
    res.json({ success: true, log });
});
/* Heatmap + trends data for a single habit (still used by charts if you want) */
router.get('/:id/logs', auth_1.requireAuth, async (req, res) => {
    const habitId = Number(req.params.id);
    const logs = await prisma_1.prisma.habitLog.findMany({
        where: { habitId, habit: { userId: req.currentUser.id } },
        orderBy: { date: 'asc' },
    });
    res.json(logs);
});
/* Habit Heatmap for last 30 days (all habits combined) */
/* Habit Heatmap for last 30 days (all habits combined) */
router.get('/heatmap', auth_1.requireAuth, async (req, res) => {
    const userId = req.currentUser.id;
    const today = (0, date_fns_1.startOfDay)(new Date());
    const from = (0, date_fns_1.subDays)(today, 29);
    const logs = await prisma_1.prisma.habitLog.findMany({
        where: {
            habit: { userId },
            date: { gte: from, lte: today },
            status: client_1.HabitStatus.COMPLETED,
        },
        include: { habit: true },
    });
    const counts = {};
    for (const log of logs) {
        const key = (0, date_fns_1.format)((0, date_fns_1.startOfDay)(log.date), 'yyyy-MM-dd');
        counts[key] = (counts[key] ?? 0) + 1;
    }
    const days = [];
    for (let i = 0; i < 30; i++) {
        const d = (0, date_fns_1.addDays)(from, i);
        const key = (0, date_fns_1.format)(d, 'yyyy-MM-dd');
        days.push({
            key,
            label: (0, date_fns_1.format)(d, 'MMM d'),
            day: (0, date_fns_1.format)(d, 'd'),
            completions: counts[key] ?? 0,
        });
    }
    res.render('habits-heatmap', {
        layout: 'main',
        title: 'Habit Heatmap',
        user: req.currentUser,
        heatmapDays: days,
    });
});
/* Goals & streaks view – multi-habit goals */
router.get('/goals', auth_1.requireAuth, async (req, res) => {
    const userId = req.currentUser.id;
    const [habits, goalsRaw] = await Promise.all([
        prisma_1.prisma.habit.findMany({
            where: { userId, isArchived: false },
            orderBy: { name: 'asc' },
        }),
        prisma_1.prisma.habitGoal.findMany({
            where: { userId },
            include: {
                items: { include: { habit: true } },
                habit: true,
            },
            orderBy: { endDate: 'asc' },
        }),
    ]);
    const goals = await Promise.all(goalsRaw.map(async (goal) => {
        // Multi-habit goal if it has items
        if (goal.items.length > 0) {
            const totalWeightedTarget = goal.items.reduce((sum, item) => sum + item.targetCount * item.weight, 0);
            let weightedCompleted = 0;
            const segments = [];
            for (const item of goal.items) {
                const completedCount = await prisma_1.prisma.habitLog.count({
                    where: {
                        habitId: item.habitId,
                        status: client_1.HabitStatus.COMPLETED,
                        date: { gte: goal.startDate, lte: goal.endDate },
                    },
                });
                const capped = Math.min(completedCount, item.targetCount);
                weightedCompleted += capped * item.weight;
                segments.push({
                    habitName: item.habit.name,
                    completed: completedCount,
                    target: item.targetCount,
                    weight: item.weight,
                });
            }
            const progressPercent = totalWeightedTarget > 0
                ? Math.min(100, (weightedCompleted / totalWeightedTarget) * 100)
                : 0;
            return {
                ...goal,
                isMulti: true,
                progressPercent,
                totalWeightedTarget,
                segments,
            };
        }
        // Legacy single-habit goal
        const progressPercent = goal.target > 0
            ? Math.min(100, (goal.currentProgress / goal.target) * 100)
            : 0;
        return {
            ...goal,
            isMulti: false,
            progressPercent,
            totalWeightedTarget: goal.target,
            segments: [],
        };
    }));
    res.render('habits-goals', {
        layout: 'main',
        title: 'Habit Goals',
        user: req.currentUser,
        habits,
        goals,
    });
});
/* Create a new multi-habit goal */
router.post('/goals', auth_1.requireAuth, async (req, res) => {
    const userId = req.currentUser.id;
    const { goalScope, startDate, endDate, description, } = req.body;
    let { habitIds, targetCounts, weights } = req.body;
    // Normalize to arrays
    if (!Array.isArray(habitIds))
        habitIds = habitIds ? [habitIds] : [];
    if (!Array.isArray(targetCounts))
        targetCounts = targetCounts ? [targetCounts] : [];
    if (!Array.isArray(weights))
        weights = weights ? [weights] : [];
    const items = habitIds
        .map((id, index) => {
        const habitId = Number(id);
        const targetCount = Number(targetCounts[index] || 0);
        const weight = weights[index] ? Number(weights[index]) : 1;
        if (!habitId || !targetCount)
            return null;
        return { habitId, targetCount, weight: weight || 1 };
    })
        .filter(Boolean);
    if (!items.length) {
        // nothing selected – for now, just redirect back
        return res.redirect('/habits/goals');
    }
    const totalWeightedTarget = items.reduce((sum, item) => sum + item.targetCount * item.weight, 0);
    const goal = await prisma_1.prisma.habitGoal.create({
        data: {
            userId,
            habitId: null, // multi-habit
            goalScope,
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: endDate ? new Date(endDate) : new Date(),
            description,
            target: Math.round(totalWeightedTarget),
            currentProgress: 0, // legacy field, not used for multi-habit calc
        },
    });
    await prisma_1.prisma.habitGoalItem.createMany({
        data: items.map((item) => ({
            habitGoalId: goal.id,
            habitId: item.habitId,
            targetCount: item.targetCount,
            weight: item.weight,
        })),
    });
    res.redirect('/habits/goals');
});
exports.default = router;
