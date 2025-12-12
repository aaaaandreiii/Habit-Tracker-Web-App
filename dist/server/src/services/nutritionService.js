"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calculateCalorieGoal = calculateCalorieGoal;
exports.getDailyNutritionSummary = getDailyNutritionSummary;
exports.scaleNutrition = scaleNutrition;
const prisma_1 = require("../lib/prisma");
const date_fns_1 = require("date-fns");
function activityMultiplier(level) {
    switch (level) {
        case "SEDENTARY":
            return 1.2;
        case "LIGHT":
            return 1.375;
        case "MODERATE":
            return 1.55;
        case "ACTIVE":
            return 1.725;
        case "VERY_ACTIVE":
            return 1.9;
        default:
            return 1.2;
    }
}
/** Mifflin-St Jeor */
function calculateCalorieGoal(params) {
    const weight = params.weightKg ?? 70;
    const height = params.heightCm ?? 170;
    const age = params.age ?? 30;
    const s = params.gender === "FEMALE" ? -161 : 5;
    const bmr = 10 * weight + 6.25 * height - 5 * age + s;
    let tdee = bmr * activityMultiplier(params.activityLevel);
    if (params.goalType === "LOSS")
        tdee -= 400;
    else if (params.goalType === "GAIN")
        tdee += 300;
    return Math.round(tdee);
}
/** Daily nutrition summary for dashboard */
async function getDailyNutritionSummary(userId, date = new Date()) {
    const start = (0, date_fns_1.startOfDay)(date);
    const end = new Date(start.getTime() + 86400000);
    const [user, foods, exercises] = await Promise.all([
        prisma_1.prisma.user.findUnique({ where: { id: userId } }),
        prisma_1.prisma.userFoodEntry.findMany({
            where: { userId, dateTime: { gte: start, lt: end } },
        }),
        prisma_1.prisma.exerciseLog.findMany({
            where: { userId, dateTime: { gte: start, lt: end } },
        }),
    ]);
    const caloriesEaten = foods.reduce((sum, f) => sum + f.calories, 0);
    const protein = foods.reduce((sum, f) => sum + f.protein, 0);
    const carbs = foods.reduce((sum, f) => sum + f.carbs, 0);
    const fat = foods.reduce((sum, f) => sum + f.fat, 0);
    const fiber = foods.reduce((sum, f) => sum + f.fiber, 0);
    const sugar = foods.reduce((sum, f) => sum + f.sugar, 0);
    const sodium = foods.reduce((sum, f) => sum + f.sodium, 0);
    const caloriesBurned = exercises.reduce((sum, e) => sum + e.caloriesBurned, 0);
    const goal = user?.calorieGoal ??
        calculateCalorieGoal({
            gender: user?.gender ?? null,
            weightKg: user?.weightKg ?? null,
            heightCm: user?.heightCm ?? null,
            age: user?.age ?? null,
            activityLevel: user?.activityLevel ?? null,
            goalType: user?.goalType ?? null,
        });
    const netCalories = goal - caloriesEaten + caloriesBurned;
    const remaining = goal - caloriesEaten + caloriesBurned;
    return {
        goal,
        caloriesEaten,
        caloriesBurned,
        netCalories,
        remaining,
        protein,
        carbs,
        fat,
        fiber,
        sugar,
        sodium,
    };
}
/** Utility to compute per-entry macros based on base nutrition. */
function scaleNutrition(base, baseAmount, quantity, unit) {
    // Simplified: treat unit as grams equivalent; for real app add unit conversion table.
    const factor = quantity / baseAmount || 0;
    return {
        calories: base.calories * factor,
        protein: base.protein * factor,
        carbs: base.carbs * factor,
        fat: base.fat * factor,
        fiber: (base.fiber ?? 0) * factor,
        sugar: (base.sugar ?? 0) * factor,
        sodium: (base.sodium ?? 0) * factor,
    };
}
