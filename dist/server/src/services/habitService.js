"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getTodayHabits = getTodayHabits;
exports.logHabit = logHabit;
exports.getHabitStreak = getHabitStreak;
// server/src/services/habitService.ts
const prisma_1 = require("../lib/prisma");
const client_1 = require("@prisma/client");
const date_fns_1 = require("date-fns");
async function getTodayHabits(userId, date = new Date()) {
    const today = (0, date_fns_1.startOfDay)(date);
    const habits = await prisma_1.prisma.habit.findMany({
        where: {
            userId,
            isArchived: false,
            // For now: always show active habits, regardless of start/end date
            // You can re-introduce scheduling later if you want.
        },
        include: {
            logs: {
                where: { date: { gte: today, lt: new Date(today.getTime() + 86400000) } },
            },
        },
    });
    return habits;
}
async function logHabit(params) {
    const dayStart = (0, date_fns_1.startOfDay)(params.date);
    const nextDay = new Date(dayStart.getTime() + 86400000);
    const existing = await prisma_1.prisma.habitLog.findFirst({
        where: {
            habitId: params.habitId,
            date: { gte: dayStart, lt: nextDay },
        },
    });
    let delta = 0;
    let log;
    if (existing) {
        if (existing.status !== client_1.HabitStatus.COMPLETED && params.status === client_1.HabitStatus.COMPLETED) {
            delta = 1;
        }
        else if (existing.status === client_1.HabitStatus.COMPLETED &&
            params.status !== client_1.HabitStatus.COMPLETED) {
            delta = -1;
        }
        log = await prisma_1.prisma.habitLog.update({
            where: { id: existing.id },
            data: { status: params.status, value: params.value, notes: params.notes },
        });
    }
    else {
        if (params.status === client_1.HabitStatus.COMPLETED) {
            delta = 1;
        }
        log = await prisma_1.prisma.habitLog.create({
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
        await prisma_1.prisma.habitGoal.updateMany({
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
async function getHabitStreak(habitId) {
    const logs = await prisma_1.prisma.habitLog.findMany({
        where: { habitId },
        orderBy: { date: 'desc' },
    });
    let currentStreak = 0;
    let longestStreak = 0;
    if (!logs.length)
        return { currentStreak, longestStreak };
    const completedDays = logs
        .filter((l) => l.status === client_1.HabitStatus.COMPLETED)
        .map((l) => (0, date_fns_1.startOfDay)(l.date));
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
        }
        else {
            tmp = 1;
        }
        longestStreak = Math.max(longestStreak, tmp);
    }
    let dateCursor = (0, date_fns_1.startOfDay)(new Date());
    let streak = 0;
    while (true) {
        const hasLog = completedDays.some((d) => (0, date_fns_1.isSameDay)(d, dateCursor));
        if (hasLog) {
            streak++;
            dateCursor = (0, date_fns_1.subDays)(dateCursor, 1);
        }
        else {
            break;
        }
    }
    currentStreak = streak;
    return { currentStreak, longestStreak };
}
