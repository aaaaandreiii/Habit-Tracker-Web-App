"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const habitService_1 = require("../services/habitService");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
const router = (0, express_1.Router)();
/* Today view with quick logging */
router.get("/today", auth_1.requireAuth, async (req, res) => {
    const userId = req.currentUser.id;
    const dateParam = req.query.date;
    let currentDate = new Date();
    if (typeof dateParam === "string" && dateParam.trim() !== "") {
        try {
            const parsed = (0, date_fns_1.parseISO)(dateParam);
            if (!isNaN(parsed.getTime())) {
                currentDate = parsed;
            }
        }
        catch {
            // ignore bad date and fall back to today
        }
    }
    const habits = await (0, habitService_1.getTodayHabits)(userId, currentDate);
    const prevDate = (0, date_fns_1.subDays)(currentDate, 1);
    const nextDate = (0, date_fns_1.addDays)(currentDate, 1);
    const categories = Array.from(new Set(habits
        .map((h) => h.category)
        .filter((c) => !!c && c.trim() !== ""))).sort((a, b) => a.localeCompare(b));
    res.render("habits-today", {
        layout: "main",
        title: "Today's Habits",
        user: req.currentUser,
        habits,
        currentDate,
        prevDate,
        nextDate,
        categories,
    });
});
/* Habit creation form */
router.get("/new", auth_1.requireAuth, (req, res) => {
    res.render("habits-edit", {
        layout: "main",
        title: "New Habit",
        user: req.currentUser,
        habit: null,
    });
});
router.post("/new", auth_1.requireAuth, async (req, res) => {
    const userId = req.currentUser.id;
    const { name, description, habitType, frequencyType, targetValue, startDate, endDate, category, color, icon, noEndDate, timeOfDay, daysOfWeek, dayOfMonth, yearlyMonth, yearlyDay, scheduleDates, } = req.body;
    const maxOrder = await prisma_1.prisma.habit.aggregate({
        _max: { sortOrder: true },
        where: { userId },
    });
    // Normalize daysOfWeek
    let daysOfWeekStr = null;
    if (Array.isArray(daysOfWeek)) {
        daysOfWeekStr = daysOfWeek.join(",");
    }
    else if (typeof daysOfWeek === "string" && daysOfWeek.trim() !== "") {
        daysOfWeekStr = daysOfWeek;
    }
    const freq = frequencyType;
    const habit = await prisma_1.prisma.habit.create({
        data: {
            userId,
            name,
            description,
            habitType,
            frequencyType: freq,
            targetValue: targetValue ? Number(targetValue) : null,
            startDate: startDate ? new Date(startDate) : new Date(),
            endDate: noEndDate === "on" || !endDate ? null : new Date(endDate),
            category,
            color,
            icon,
            timeOfDay: timeOfDay || "ANY",
            sortOrder: (maxOrder._max.sortOrder ?? 0) + 1,
            daysOfWeek: freq === "WEEKLY" ? daysOfWeekStr : null,
            dayOfMonth: freq === "MONTHLY" ? (dayOfMonth ? Number(dayOfMonth) : null) : null,
            yearlyMonth: freq === "YEARLY" ? (yearlyMonth ? Number(yearlyMonth) : null) : null,
            yearlyDay: freq === "YEARLY" ? (yearlyDay ? Number(yearlyDay) : null) : null,
        },
    });
    if (freq === "CUSTOM") {
        let dates = scheduleDates;
        if (!Array.isArray(dates)) {
            dates = dates ? [dates] : [];
        }
        await prisma_1.prisma.habitScheduleDate.createMany({
            data: dates
                .filter((d) => d && d.trim() !== "")
                .map((d) => ({
                habitId: habit.id,
                date: new Date(d),
            })),
        });
    }
    res.redirect("/habits/today");
});
/* Edit habit form */
router.get("/:id/edit", auth_1.requireAuth, async (req, res) => {
    const userId = req.currentUser.id;
    const habitId = Number(req.params.id);
    const habit = await prisma_1.prisma.habit.findFirst({
        where: { id: habitId, userId },
        include: {
            scheduleDates: true, // once you add this relation – see section below
        },
    });
    if (!habit) {
        return res.redirect("/habits/today");
    }
    res.render("habits-edit", {
        layout: "main",
        title: "Edit Habit",
        user: req.currentUser,
        habit,
    });
});
/* Edit habit */
router.post("/:id/edit", auth_1.requireAuth, async (req, res) => {
    const userId = req.currentUser.id;
    const habitId = Number(req.params.id);
    const { name, description, habitType, frequencyType, targetValue, startDate, endDate, category, color, icon, isArchived, noEndDate, timeOfDay, daysOfWeek, dayOfMonth, yearlyMonth, yearlyDay, scheduleDates, } = req.body;
    // Normalize daysOfWeek
    let daysOfWeekStr = null;
    if (Array.isArray(daysOfWeek)) {
        daysOfWeekStr = daysOfWeek.join(",");
    }
    else if (typeof daysOfWeek === "string" && daysOfWeek.trim() !== "") {
        daysOfWeekStr = daysOfWeek;
    }
    const freq = frequencyType;
    const habit = await prisma_1.prisma.habit.update({
        where: { id: habitId },
        data: {
            name,
            description,
            habitType,
            frequencyType: freq,
            targetValue: targetValue ? Number(targetValue) : null,
            startDate: startDate ? new Date(startDate) : undefined,
            endDate: noEndDate === "on" ? null : endDate ? new Date(endDate) : undefined,
            category,
            color,
            icon,
            isArchived: Boolean(isArchived),
            timeOfDay: timeOfDay || "ANY",
            // frequency-specific fields
            daysOfWeek: freq === "WEEKLY" ? daysOfWeekStr : null,
            dayOfMonth: freq === "MONTHLY" ? (dayOfMonth ? Number(dayOfMonth) : null) : null,
            yearlyMonth: freq === "YEARLY" ? (yearlyMonth ? Number(yearlyMonth) : null) : null,
            yearlyDay: freq === "YEARLY" ? (yearlyDay ? Number(yearlyDay) : null) : null,
        },
    });
    // Update custom schedule dates (only for CUSTOM)
    if (freq === "CUSTOM") {
        let dates = scheduleDates;
        if (!Array.isArray(dates)) {
            dates = dates ? [dates] : [];
        }
        await prisma_1.prisma.$transaction([
            prisma_1.prisma.habitScheduleDate.deleteMany({ where: { habitId } }),
            prisma_1.prisma.habitScheduleDate.createMany({
                data: dates
                    .filter((d) => d && d.trim() !== "")
                    .map((d) => ({
                    habitId,
                    date: new Date(d),
                })),
            }),
        ]);
    }
    else {
        // If no longer custom, clear any old schedule dates
        await prisma_1.prisma.habitScheduleDate.deleteMany({ where: { habitId } });
    }
    res.redirect("/habits/today");
});
/* Delete habit (hard delete) */
router.post("/:id/delete", auth_1.requireAuth, async (req, res) => {
    const habitId = Number(req.params.id);
    const userId = req.currentUser.id;
    const habit = await prisma_1.prisma.habit.findFirst({
        where: { id: habitId, userId },
    });
    if (!habit) {
        return res.redirect("/habits/today");
    }
    await prisma_1.prisma.$transaction(async (tx) => {
        await tx.journalEntryHabit.deleteMany({ where: { habitId } });
        await tx.habitGoalItem.deleteMany({ where: { habitId } });
        await tx.habitLog.deleteMany({ where: { habitId } });
        // Any single-habit goals pointing to this habit → detach
        await tx.habitGoal.updateMany({
            where: { habitId },
            data: { habitId: null },
        });
        await tx.habit.delete({ where: { id: habitId } });
    });
    res.redirect("/habits/today");
});
/* Save custom habit order (drag & drop) */
router.post("/reorder", auth_1.requireAuth, async (req, res) => {
    const userId = req.currentUser.id;
    const { order } = req.body;
    if (!Array.isArray(order)) {
        return res.status(400).json({ error: "Invalid order payload" });
    }
    await prisma_1.prisma.$transaction(order.map((item) => prisma_1.prisma.habit.updateMany({
        where: { id: item.habitId, userId },
        data: { sortOrder: item.sortOrder },
    })));
    res.json({ success: true });
});
/* Quick log endpoint (AJAX) */
router.post("/:id/log", auth_1.requireAuth, async (req, res) => {
    const habitId = Number(req.params.id);
    const { status, value, notes, date } = req.body;
    let parsedDate;
    if (typeof date === "string" && date.trim() !== "") {
        try {
            parsedDate = (0, date_fns_1.parseISO)(date);
            if (isNaN(parsedDate.getTime())) {
                // invalid string → fall back to now
                parsedDate = new Date();
            }
        }
        catch {
            parsedDate = new Date();
        }
    }
    else {
        parsedDate = new Date();
    }
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
router.get("/:id/logs", auth_1.requireAuth, async (req, res) => {
    const habitId = Number(req.params.id);
    const logs = await prisma_1.prisma.habitLog.findMany({
        where: { habitId, habit: { userId: req.currentUser.id } },
        orderBy: { date: "asc" },
    });
    res.json(logs);
});
/* Habit Heatmap for last 30 days (all habits combined) */
router.get("/heatmap", auth_1.requireAuth, async (req, res) => {
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
    const habitNamesByDate = {};
    for (const log of logs) {
        const key = (0, date_fns_1.format)((0, date_fns_1.startOfDay)(log.date), "yyyy-MM-dd");
        counts[key] = (counts[key] ?? 0) + 1;
        const name = log.habit.name;
        if (!habitNamesByDate[key])
            habitNamesByDate[key] = [];
        if (!habitNamesByDate[key].includes(name)) {
            habitNamesByDate[key].push(name);
        }
    }
    const days = [];
    for (let i = 0; i < 30; i++) {
        const d = (0, date_fns_1.addDays)(from, i);
        const key = (0, date_fns_1.format)(d, "yyyy-MM-dd");
        days.push({
            key,
            label: (0, date_fns_1.format)(d, "MMM d"),
            day: (0, date_fns_1.format)(d, "d"),
            completions: counts[key] ?? 0,
            habits: habitNamesByDate[key] ?? [],
        });
    }
    res.render("habits-heatmap", {
        layout: "main",
        title: "Habit Heatmap",
        user: req.currentUser,
        heatmapDays: days,
    });
});
/* Spreadsheet-style habit matrix view (weeks × habits) */
router.get("/matrix", auth_1.requireAuth, async (req, res) => {
    const userId = req.currentUser.id;
    const offset = Number(req.query.offset || 0); // 0 = current week
    const today = new Date();
    const baseWeekStart = (0, date_fns_1.startOfWeek)((0, date_fns_1.addWeeks)(today, offset), {
        weekStartsOn: 1,
    }); // Monday
    const weekStarts = [
        (0, date_fns_1.subWeeks)(baseWeekStart, 1),
        baseWeekStart,
        (0, date_fns_1.addWeeks)(baseWeekStart, 1),
    ];
    const weeks = weekStarts.map((start) => {
        const end = (0, date_fns_1.addDays)(start, 6);
        return {
            start,
            end,
            label: `Week ${(0, date_fns_1.getISOWeek)(start)}`,
        };
    });
    const globalStart = weeks[0].start;
    const globalEnd = weeks[weeks.length - 1].end;
    const habits = await prisma_1.prisma.habit.findMany({
        where: { userId, isArchived: false },
        orderBy: [{ sortOrder: "asc" }, { id: "asc" }],
    });
    if (!habits.length) {
        return res.render("habits-matrix", {
            layout: "main",
            title: "Habit Matrix",
            user: req.currentUser,
            habits: [],
            weeks: [],
            days: [],
            rows: [],
            dailySummaries: [],
            habitSummaries: [],
            offset,
            prevOffset: offset - 1,
            nextOffset: offset + 1,
        });
    }
    const logs = await prisma_1.prisma.habitLog.findMany({
        where: {
            habit: { userId },
            date: {
                gte: (0, date_fns_1.startOfDay)(globalStart),
                lt: (0, date_fns_1.addDays)((0, date_fns_1.startOfDay)(globalEnd), 1),
            },
        },
    });
    const days = [];
    const weeksForView = [];
    weeks.forEach((week, weekIndex) => {
        const weekDays = [];
        for (let i = 0; i < 7; i++) {
            const d = (0, date_fns_1.addDays)(week.start, i);
            const day = {
                dateKey: (0, date_fns_1.format)(d, "yyyy-MM-dd"),
                label: (0, date_fns_1.format)(d, "MMM d"),
                weekday: (0, date_fns_1.format)(d, "EEE"),
                weekIndex,
            };
            weekDays.push(day);
            days.push(day);
        }
        weeksForView.push({
            label: week.label,
            days: weekDays,
        });
    });
    // Map logs by habit + date
    const logMap = new Map();
    for (const log of logs) {
        const key = `${log.habitId}-${(0, date_fns_1.format)((0, date_fns_1.startOfDay)(log.date), "yyyy-MM-dd")}`;
        logMap.set(key, log);
    }
    const rows = habits.map((habit) => {
        const cells = days.map((day) => {
            const log = logMap.get(`${habit.id}-${day.dateKey}`);
            const isCompleted = log?.status === client_1.HabitStatus.COMPLETED;
            const rawValue = typeof log?.value === "number" ? log.value : null;
            let cellProgress = 0;
            if (habit.habitType === "BOOLEAN") {
                cellProgress = isCompleted ? 100 : 0;
            }
            else if (habit.targetValue && rawValue != null) {
                cellProgress = Math.round(Math.max(0, Math.min(100, (rawValue / habit.targetValue) * 100)));
            }
            else if (rawValue != null) {
                // No explicit target – treat any value as full for visualization
                cellProgress = 100;
            }
            else {
                cellProgress = 0;
            }
            return {
                dateKey: day.dateKey,
                dateLabel: day.label,
                isCompleted,
                status: log?.status ?? null,
                value: rawValue,
                progressPercent: cellProgress,
            };
        });
        const expectedCount = days.length;
        const completedCount = cells.filter((c) => c.isCompleted).length;
        const progressPercent = expectedCount > 0
            ? Math.round((completedCount / expectedCount) * 100)
            : 0;
        return {
            habit,
            cells,
            expectedCount,
            completedCount,
            progressPercent,
        };
    });
    const totalHabits = habits.length;
    const dailySummaries = days.map((day, index) => {
        let completed = 0;
        rows.forEach((row) => {
            if (row.cells[index].isCompleted)
                completed += 1;
        });
        const notDone = totalHabits - completed;
        const percent = totalHabits > 0 ? Math.round((completed / totalHabits) * 100) : 0;
        return {
            dateKey: day.dateKey,
            label: day.label,
            completed,
            notDone,
            percent,
        };
    });
    const habitSummaries = rows.map((row) => ({
        habitName: row.habit.name,
        expected: row.expectedCount,
        completed: row.completedCount,
        progressPercent: row.progressPercent,
    }));
    res.render("habits-matrix", {
        layout: "main",
        title: "Habit Matrix",
        user: req.currentUser,
        habits,
        weeks: weeksForView,
        days,
        rows,
        dailySummaries,
        habitSummaries,
        offset,
        prevOffset: offset - 1,
        nextOffset: offset + 1,
    });
});
/* Goals & streaks view – multi-habit goals */
router.get("/goals", auth_1.requireAuth, async (req, res) => {
    const userId = req.currentUser.id;
    const [habits, goalsRaw] = await Promise.all([
        prisma_1.prisma.habit.findMany({
            where: { userId, isArchived: false },
            orderBy: { name: "asc" },
        }),
        prisma_1.prisma.habitGoal.findMany({
            where: { userId },
            include: {
                items: { include: { habit: true } },
                habit: true,
            },
            orderBy: { endDate: "asc" },
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
    res.render("habits-goals", {
        layout: "main",
        title: "Habit Goals",
        user: req.currentUser,
        habits,
        goals,
    });
});
/* Create a new multi-habit goal */
router.post("/goals", auth_1.requireAuth, async (req, res) => {
    const userId = req.currentUser.id;
    const { goalScope, startDate, endDate, description } = req.body;
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
        return res.redirect("/habits/goals");
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
    res.redirect("/habits/goals");
});
exports.default = router;
