"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma = new client_1.PrismaClient();
async function main() {
    const passwordHash = await bcryptjs_1.default.hash('password123', 10);
    const user = await prisma.user.create({
        data: {
            email: 'demo@example.com',
            name: 'Demo User',
            passwordHash,
            age: 30,
            heightCm: 175,
            weightKg: 75,
            gender: 'MALE',
            activityLevel: 'MODERATE',
            goalType: 'LOSS',
            calorieGoal: 2200,
            proteinGoalG: 150,
            carbsGoalG: 180,
            fatGoalG: 70,
            waterGoalMl: 2500,
        },
    });
    // Habits
    const drinkWater = await prisma.habit.create({
        data: {
            userId: user.id,
            name: 'Drink Water',
            description: 'Drink 8 glasses of water',
            habitType: client_1.HabitType.QUANTITY,
            frequencyType: client_1.FrequencyType.DAILY,
            targetValue: 8,
            startDate: new Date(),
            category: 'Health',
            color: '#38bdf8',
            icon: '💧',
        },
    });
    const exercise = await prisma.habit.create({
        data: {
            userId: user.id,
            name: 'Exercise',
            description: 'Move your body',
            habitType: client_1.HabitType.DURATION,
            frequencyType: client_1.FrequencyType.DAILY,
            targetValue: 30,
            startDate: new Date(),
            category: 'Fitness',
            color: '#22c55e',
            icon: '🔥',
        },
    });
    // Generic foods
    const chicken = await prisma.foodItem.create({
        data: {
            name: 'Chicken breast, cooked',
            category: 'Protein',
            baseServingSizeG: 100,
            calories: 165,
            protein: 31,
            carbs: 0,
            fat: 3.6,
            fiber: 0,
            sugar: 0,
            sodium: 74,
            isVerified: true,
            source: 'Demo',
        },
    });
    const rice = await prisma.foodItem.create({
        data: {
            name: 'White rice, cooked',
            category: 'Carbs',
            baseServingSizeG: 100,
            calories: 130,
            protein: 2.7,
            carbs: 28,
            fat: 0.3,
            fiber: 0.4,
            sugar: 0.1,
            sodium: 1,
            isVerified: true,
            source: 'Demo',
        },
    });
    const apple = await prisma.foodItem.create({
        data: {
            name: 'Apple, raw',
            category: 'Fruit',
            baseServingSizeG: 100,
            calories: 52,
            protein: 0.3,
            carbs: 14,
            fat: 0.2,
            fiber: 2.4,
            sugar: 10.4,
            sodium: 1,
            isVerified: true,
            source: 'Demo',
        },
    });
    // Branded food
    const proteinBar = await prisma.brandedFoodItem.create({
        data: {
            brandName: 'DemoFit',
            productName: 'Protein Bar Chocolate',
            barcode: '1234567890123',
            servingSizeG: 60,
            calories: 210,
            protein: 20,
            carbs: 18,
            fat: 7,
            fiber: 6,
            sugar: 3,
            sodium: 150,
            isVerified: true,
            source: 'Demo',
        },
    });
    // Sample recipe
    const recipe = await prisma.recipe.create({
        data: {
            userId: user.id,
            name: 'Chicken & Rice Bowl',
            description: 'Simple high-protein bowl with chicken and rice.',
            numberOfServings: 2,
            caloriesPerServ: 400,
            proteinPerServ: 35,
            carbsPerServ: 40,
            fatPerServ: 10,
        },
    });
    await prisma.recipeIngredient.createMany({
        data: [
            {
                recipeId: recipe.id,
                foodItemId: chicken.id,
                quantity: 150,
                unit: client_1.Unit.G,
            },
            {
                recipeId: recipe.id,
                foodItemId: rice.id,
                quantity: 150,
                unit: client_1.Unit.G,
            },
        ],
    });
    // Sample logs
    await prisma.userFoodEntry.create({
        data: {
            userId: user.id,
            dateTime: new Date(),
            mealType: client_1.MealType.BREAKFAST,
            foodItemId: apple.id,
            quantity: 150,
            unit: client_1.Unit.G,
            calories: 78,
            protein: 0.5,
            carbs: 21,
            fat: 0.3,
            fiber: 3.6,
            sugar: 15.6,
            sodium: 2,
        },
    });
    await prisma.waterLog.createMany({
        data: [
            { userId: user.id, amount: 250, unit: client_1.Unit.ML, dateTime: new Date() },
            { userId: user.id, amount: 500, unit: client_1.Unit.ML, dateTime: new Date() },
        ],
    });
    await prisma.exerciseLog.create({
        data: {
            userId: user.id,
            exerciseType: 'Running',
            durationMin: 30,
            caloriesBurned: 300,
            dateTime: new Date(),
            source: 'MANUAL',
        },
    });
    await prisma.weightLog.create({
        data: {
            userId: user.id,
            weightKg: 75,
            date: new Date(),
        },
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(async () => {
    await prisma.$disconnect();
});
