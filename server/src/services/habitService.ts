import { prisma } from '../lib/prisma';
import { HabitStatus } from '@prisma/client';
import { startOfDay, subDays, isSameDay, getDay, getDate, getMonth } from 'date-fns';

export async function getTodayHabits(userId: number, date = new Date()) {
  const today = startOfDay(date);

  const habits = await prisma.habit.findMany({
    where: {
      userId,
      isArchived: false,
    },
    include: {
      logs: {
        where: { date: { gte: today, lt: new Date(today.getTime() + 86400000) } },
      },
      scheduleDates: true,
    },
    orderBy: { sortOrder: 'asc' }, // if you added sortOrder
  });

  return habits.filter((habit) => isHabitScheduledForDate(habit as any, today));
}

function isHabitScheduledForDate(
  habit: any,
  date: Date
): boolean {
  const dow = getDay(date); // 0 = Sunday
  const dom = getDate(date);
  const month = getMonth(date) + 1; // 1-12

  switch (habit.frequencyType) {
    case 'DAILY':
      return true;

    case 'WEEKLY': {
      if (!habit.daysOfWeek) return true; // treat as every day of week
      const tokens = String(habit.daysOfWeek)
        .split(',')
        .map((s: string) => s.trim().toUpperCase())
        .filter(Boolean);
      const map = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'];
      const todayToken = map[dow];
      return tokens.includes(todayToken);
    }

    case 'MONTHLY': {
      if (!habit.dayOfMonth) return true;
      return dom === habit.dayOfMonth;
    }

    case 'YEARLY': {
      if (!habit.yearlyMonth || !habit.yearlyDay) return true;
      return month === habit.yearlyMonth && dom === habit.yearlyDay;
    }

    case 'CUSTOM': {
      if (!habit.scheduleDates || !habit.scheduleDates.length) return true;
      return habit.scheduleDates.some((s: any) => isSameDay(s.date, date));
    }

    default:
      return true;
  }
}

export async function logHabit(params: {
  habitId: number;
  date: Date;
  status: HabitStatus;
  value?: number;
  notes?: string;
}) {
  const dayStart = startOfDay(params.date);
  const nextDay = new Date(dayStart.getTime() + 86400000);

  const existing = await prisma.habitLog.findFirst({
    where: {
      habitId: params.habitId,
      date: { gte: dayStart, lt: nextDay },
    },
  });

  let delta = 0;
  let log;

  if (existing) {
    if (existing.status !== HabitStatus.COMPLETED && params.status === HabitStatus.COMPLETED) {
      delta = 1;
    } else if (
      existing.status === HabitStatus.COMPLETED &&
      params.status !== HabitStatus.COMPLETED
    ) {
      delta = -1;
    }

    log = await prisma.habitLog.update({
      where: { id: existing.id },
      data: { status: params.status, value: params.value, notes: params.notes },
    });
  } else {
    if (params.status === HabitStatus.COMPLETED) {
      delta = 1;
    }

    log = await prisma.habitLog.create({
      data: {
        habitId: params.habitId,
        date: dayStart,
        status: params.status,
        value: params.value,
        notes: params.notes,
      },
    });
  }

  if (delta !== 0) {
    await prisma.habitGoal.updateMany({
      where: {
        habitId: params.habitId,
        startDate: { lte: dayStart },
        endDate: { gte: dayStart },
      },
      data: {
        currentProgress: { increment: delta },
      },
    });
  }

  return log;
}

/** Simple streak calculation (daily habits) */
export async function getHabitStreak(habitId: number) {
  const logs = await prisma.habitLog.findMany({
    where: { habitId },
    orderBy: { date: 'desc' },
  });

  let currentStreak = 0;
  let longestStreak = 0;

  if (!logs.length) return { currentStreak, longestStreak };

  const completedDays = logs
    .filter((l) => l.status === HabitStatus.COMPLETED)
    .map((l) => startOfDay(l.date));

  let tmp = 0;
  for (let i = 0; i < completedDays.length; i++) {
    if (i === 0) {
      tmp = 1;
      longestStreak = 1;
      continue;
    }
    const prev = completedDays[i - 1];
    const cur = completedDays[i];
    const diff = (prev.getTime() - cur.getTime()) / 86400000;
    if (diff === 1) {
      tmp++;
    } else {
      tmp = 1;
    }
    longestStreak = Math.max(longestStreak, tmp);
  }

  let dateCursor = startOfDay(new Date());
  let streak = 0;
  while (true) {
    const hasLog = completedDays.some((d) => isSameDay(d, dateCursor));
    if (hasLog) {
      streak++;
      dateCursor = subDays(dateCursor, 1);
    } else {
      break;
    }
  }
  currentStreak = streak;

  return { currentStreak, longestStreak };
}
