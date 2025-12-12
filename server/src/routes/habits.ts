import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";
import { getTodayHabits, logHabit } from "../services/habitService";
import { HabitStatus } from "@prisma/client";
import {
  parseISO,
  startOfDay,
  subDays,
  addDays,
  format,
  startOfWeek,
  addWeeks,
  subWeeks,
  getISOWeek,
} from "date-fns";

const router = Router();

/* Today view with quick logging */
router.get("/today", requireAuth, async (req, res) => {
  const userId = req.currentUser!.id;

  const raw = req.query.date;

  const dateStr: string | null =
    typeof raw === "string"
      ? raw
      : Array.isArray(raw)
        ? (() => {
            const strings = raw.filter(
              (v): v is string => typeof v === "string",
            );
            return strings.length ? strings[strings.length - 1] : null;
          })()
        : null;

  let currentDate = new Date();

  if (dateStr && dateStr.trim() !== "") {
    const parsed = parseISO(dateStr);
    if (!Number.isNaN(parsed.getTime())) currentDate = parsed;
  }

  const habits = await getTodayHabits(userId, currentDate);

  const prevDate = subDays(currentDate, 1);
  const nextDate = addDays(currentDate, 1);

  const categories = Array.from(
    new Set(
      habits
        .map((h) => h.category)
        .filter((c): c is string => !!c && c.trim() !== ""),
    ),
  ).sort((a, b) => a.localeCompare(b));

  return res.render("habits-today", {
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
router.get("/new", requireAuth, (req, res) => {
  res.render("habits-edit", {
    layout: "main",
    title: "New Habit",
    user: req.currentUser,
    habit: null,
  });
});

router.post("/new", requireAuth, async (req, res) => {
  const userId = req.currentUser!.id;
  const {
    name,
    description,
    habitType,
    frequencyType,
    targetValue,
    startDate,
    endDate,
    category,
    color,
    icon,
    noEndDate,
    timeOfDay,
    daysOfWeek,
    dayOfMonth,
    yearlyMonth,
    yearlyDay,
    scheduleDates,
  } = req.body as any;

  const maxOrder = await prisma.habit.aggregate({
    _max: { sortOrder: true },
    where: { userId },
  });

  // Normalize daysOfWeek
  let daysOfWeekStr: string | null = null;
  if (Array.isArray(daysOfWeek)) {
    daysOfWeekStr = daysOfWeek.join(",");
  } else if (typeof daysOfWeek === "string" && daysOfWeek.trim() !== "") {
    daysOfWeekStr = daysOfWeek;
  }

  const freq = frequencyType as any;

  const habit = await prisma.habit.create({
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
      dayOfMonth:
        freq === "MONTHLY" ? (dayOfMonth ? Number(dayOfMonth) : null) : null,
      yearlyMonth:
        freq === "YEARLY" ? (yearlyMonth ? Number(yearlyMonth) : null) : null,
      yearlyDay:
        freq === "YEARLY" ? (yearlyDay ? Number(yearlyDay) : null) : null,
    },
  });

  if (freq === "CUSTOM") {
    let dates = scheduleDates;
    if (!Array.isArray(dates)) {
      dates = dates ? [dates] : [];
    }

    await prisma.habitScheduleDate.createMany({
      data: (dates as string[])
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
router.get("/:id/edit", requireAuth, async (req, res) => {
  const userId = req.currentUser!.id;
  const habitId = Number(req.params.id);

  const habit = await prisma.habit.findFirst({
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
router.post("/:id/edit", requireAuth, async (req, res) => {
  const userId = req.currentUser!.id;
  const habitId = Number(req.params.id);

  const {
    name,
    description,
    habitType,
    frequencyType,
    targetValue,
    startDate,
    endDate,
    category,
    color,
    icon,
    isArchived,
    noEndDate,
    timeOfDay,
    daysOfWeek,
    dayOfMonth,
    yearlyMonth,
    yearlyDay,
    scheduleDates,
  } = req.body as any;

  // Normalize daysOfWeek
  let daysOfWeekStr: string | null = null;
  if (Array.isArray(daysOfWeek)) {
    daysOfWeekStr = daysOfWeek.join(",");
  } else if (typeof daysOfWeek === "string" && daysOfWeek.trim() !== "") {
    daysOfWeekStr = daysOfWeek;
  }

  const freq = frequencyType as any;

  const habit = await prisma.habit.update({
    where: { id: habitId },
    data: {
      name,
      description,
      habitType,
      frequencyType: freq,
      targetValue: targetValue ? Number(targetValue) : null,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate:
        noEndDate === "on" ? null : endDate ? new Date(endDate) : undefined,
      category,
      color,
      icon,
      isArchived: Boolean(isArchived),
      timeOfDay: timeOfDay || "ANY",
      // frequency-specific fields
      daysOfWeek: freq === "WEEKLY" ? daysOfWeekStr : null,
      dayOfMonth:
        freq === "MONTHLY" ? (dayOfMonth ? Number(dayOfMonth) : null) : null,
      yearlyMonth:
        freq === "YEARLY" ? (yearlyMonth ? Number(yearlyMonth) : null) : null,
      yearlyDay:
        freq === "YEARLY" ? (yearlyDay ? Number(yearlyDay) : null) : null,
    },
  });

  // Update custom schedule dates (only for CUSTOM)
  if (freq === "CUSTOM") {
    let dates = scheduleDates;
    if (!Array.isArray(dates)) {
      dates = dates ? [dates] : [];
    }

    await prisma.$transaction([
      prisma.habitScheduleDate.deleteMany({ where: { habitId } }),
      prisma.habitScheduleDate.createMany({
        data: (dates as string[])
          .filter((d) => d && d.trim() !== "")
          .map((d) => ({
            habitId,
            date: new Date(d),
          })),
      }),
    ]);
  } else {
    // If no longer custom, clear any old schedule dates
    await prisma.habitScheduleDate.deleteMany({ where: { habitId } });
  }

  res.redirect("/habits/today");
});

/* Delete habit (hard delete) */
router.post("/:id/delete", requireAuth, async (req, res) => {
  const habitId = Number(req.params.id);
  const userId = req.currentUser!.id;

  const habit = await prisma.habit.findFirst({
    where: { id: habitId, userId },
  });

  if (!habit) {
    return res.redirect("/habits/today");
  }

  await prisma.$transaction(async (tx) => {
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
router.post("/reorder", requireAuth, async (req, res) => {
  const userId = req.currentUser!.id;
  const { order } = req.body as {
    order: { habitId: number; sortOrder: number }[];
  };

  if (!Array.isArray(order)) {
    return res.status(400).json({ error: "Invalid order payload" });
  }

  await prisma.$transaction(
    order.map((item) =>
      prisma.habit.updateMany({
        where: { id: item.habitId, userId },
        data: { sortOrder: item.sortOrder },
      }),
    ),
  );

  res.json({ success: true });
});

/* Quick log endpoint (AJAX) */
router.post("/:id/log", requireAuth, async (req, res) => {
  const habitId = Number(req.params.id);
  const { status, value, notes, date } = req.body;

  let parsedDate: Date;

  if (typeof date === "string" && date.trim() !== "") {
    try {
      parsedDate = parseISO(date);
      if (isNaN(parsedDate.getTime())) {
        // invalid string → fall back to now
        parsedDate = new Date();
      }
    } catch {
      parsedDate = new Date();
    }
  } else {
    parsedDate = new Date();
  }

  const log = await logHabit({
    habitId,
    date: parsedDate,
    status: status as HabitStatus,
    value: value ? Number(value) : undefined,
    notes,
  });

  res.json({ success: true, log });
});

/* Heatmap + trends data for a single habit (still used by charts if you want) */
router.get("/:id/logs", requireAuth, async (req, res) => {
  const habitId = Number(req.params.id);
  const logs = await prisma.habitLog.findMany({
    where: { habitId, habit: { userId: req.currentUser!.id } },
    orderBy: { date: "asc" },
  });
  res.json(logs);
});

/* Habit Heatmap for last 30 days (all habits combined) */
router.get("/heatmap", requireAuth, async (req, res) => {
  const userId = req.currentUser!.id;
  const today = startOfDay(new Date());
  const from = subDays(today, 29);

  const logs = await prisma.habitLog.findMany({
    where: {
      habit: { userId },
      date: { gte: from, lte: today },
      status: HabitStatus.COMPLETED,
    },
    include: { habit: true },
  });

  const counts: Record<string, number> = {};
  const habitNamesByDate: Record<string, string[]> = {};

  for (const log of logs) {
    const key = format(startOfDay(log.date), "yyyy-MM-dd");
    counts[key] = (counts[key] ?? 0) + 1;

    const name = log.habit.name;
    if (!habitNamesByDate[key]) habitNamesByDate[key] = [];
    if (!habitNamesByDate[key].includes(name)) {
      habitNamesByDate[key].push(name);
    }
  }

  const days: {
    key: string;
    label: string;
    day: string;
    completions: number;
    habits: string[];
  }[] = [];

  for (let i = 0; i < 30; i++) {
    const d = addDays(from, i);
    const key = format(d, "yyyy-MM-dd");
    days.push({
      key,
      label: format(d, "MMM d"),
      day: format(d, "d"),
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
router.get("/matrix", requireAuth, async (req, res) => {
  const userId = req.currentUser!.id;
  const offset = Number(req.query.offset || 0); // 0 = current week

  const today = new Date();
  const baseWeekStart = startOfWeek(addWeeks(today, offset), {
    weekStartsOn: 1,
  }); // Monday

  const weekStarts = [
    subWeeks(baseWeekStart, 1),
    baseWeekStart,
    addWeeks(baseWeekStart, 1),
  ];

  const weeks = weekStarts.map((start) => {
    const end = addDays(start, 6);
    return {
      start,
      end,
      label: `Week ${getISOWeek(start)}`,
    };
  });

  const globalStart = weeks[0].start;
  const globalEnd = weeks[weeks.length - 1].end;

  const habits = await prisma.habit.findMany({
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

  const logs = await prisma.habitLog.findMany({
    where: {
      habit: { userId },
      date: {
        gte: startOfDay(globalStart),
        lt: addDays(startOfDay(globalEnd), 1),
      },
    },
  });

  type Day = {
    dateKey: string;
    label: string;
    weekday: string;
    weekIndex: number;
  };
  type WeekView = { label: string; days: Day[] };

  const days: Day[] = [];
  const weeksForView: WeekView[] = [];

  weeks.forEach((week, weekIndex) => {
    const weekDays: Day[] = [];
    for (let i = 0; i < 7; i++) {
      const d = addDays(week.start, i);
      const day: Day = {
        dateKey: format(d, "yyyy-MM-dd"),
        label: format(d, "MMM d"),
        weekday: format(d, "EEE"),
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
  const logMap = new Map<string, (typeof logs)[number]>();
  for (const log of logs) {
    const key = `${log.habitId}-${format(startOfDay(log.date), "yyyy-MM-dd")}`;
    logMap.set(key, log);
  }

  const rows = habits.map((habit) => {
    const cells = days.map((day) => {
      const log = logMap.get(`${habit.id}-${day.dateKey}`);
      const isCompleted = log?.status === HabitStatus.COMPLETED;
      const rawValue = typeof log?.value === "number" ? log.value : null;

      let cellProgress = 0;

      if (habit.habitType === "BOOLEAN") {
        cellProgress = isCompleted ? 100 : 0;
      } else if (habit.targetValue && rawValue != null) {
        cellProgress = Math.round(
          Math.max(0, Math.min(100, (rawValue / habit.targetValue) * 100)),
        );
      } else if (rawValue != null) {
        // No explicit target – treat any value as full for visualization
        cellProgress = 100;
      } else {
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
    const progressPercent =
      expectedCount > 0
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
      if (row.cells[index].isCompleted) completed += 1;
    });
    const notDone = totalHabits - completed;
    const percent =
      totalHabits > 0 ? Math.round((completed / totalHabits) * 100) : 0;
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
router.get("/goals", requireAuth, async (req, res) => {
  const userId = req.currentUser!.id;

  const [habits, goalsRaw] = await Promise.all([
    prisma.habit.findMany({
      where: { userId, isArchived: false },
      orderBy: { name: "asc" },
    }),
    prisma.habitGoal.findMany({
      where: { userId },
      include: {
        items: { include: { habit: true } },
        habit: true,
      },
      orderBy: { endDate: "asc" },
    }),
  ]);

  const goals = await Promise.all(
    goalsRaw.map(async (goal) => {
      // Multi-habit goal if it has items
      if (goal.items.length > 0) {
        const totalWeightedTarget = goal.items.reduce(
          (sum, item) => sum + item.targetCount * item.weight,
          0,
        );

        let weightedCompleted = 0;
        const segments: {
          habitName: string;
          completed: number;
          target: number;
          weight: number;
        }[] = [];

        for (const item of goal.items) {
          const completedCount = await prisma.habitLog.count({
            where: {
              habitId: item.habitId,
              status: HabitStatus.COMPLETED,
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

        const progressPercent =
          totalWeightedTarget > 0
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
      const progressPercent =
        goal.target > 0
          ? Math.min(100, (goal.currentProgress / goal.target) * 100)
          : 0;

      return {
        ...goal,
        isMulti: false,
        progressPercent,
        totalWeightedTarget: goal.target,
        segments: [],
      };
    }),
  );

  res.render("habits-goals", {
    layout: "main",
    title: "Habit Goals",
    user: req.currentUser,
    habits,
    goals,
  });
});

/* Create a new multi-habit goal */
router.post("/goals", requireAuth, async (req, res) => {
  const userId = req.currentUser!.id;
  const { goalScope, startDate, endDate, description } = req.body;

  let { habitIds, targetCounts, weights } = req.body;

  // Normalize to arrays
  if (!Array.isArray(habitIds)) habitIds = habitIds ? [habitIds] : [];
  if (!Array.isArray(targetCounts))
    targetCounts = targetCounts ? [targetCounts] : [];
  if (!Array.isArray(weights)) weights = weights ? [weights] : [];

  const items = habitIds
    .map((id: string, index: number) => {
      const habitId = Number(id);
      const targetCount = Number(targetCounts[index] || 0);
      const weight = weights[index] ? Number(weights[index]) : 1;

      if (!habitId || !targetCount) return null;
      return { habitId, targetCount, weight: weight || 1 };
    })
    .filter(Boolean) as {
    habitId: number;
    targetCount: number;
    weight: number;
  }[];

  if (!items.length) {
    // nothing selected – for now, just redirect back
    return res.redirect("/habits/goals");
  }

  const totalWeightedTarget = items.reduce(
    (sum, item) => sum + item.targetCount * item.weight,
    0,
  );

  const goal = await prisma.habitGoal.create({
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

  await prisma.habitGoalItem.createMany({
    data: items.map((item) => ({
      habitGoalId: goal.id,
      habitId: item.habitId,
      targetCount: item.targetCount,
      weight: item.weight,
    })),
  });

  res.redirect("/habits/goals");
});

export default router;
