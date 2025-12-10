-- CreateTable
CREATE TABLE `User` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `email` VARCHAR(191) NOT NULL,
    `passwordHash` VARCHAR(191) NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `age` INTEGER NULL,
    `heightCm` DOUBLE NULL,
    `weightKg` DOUBLE NULL,
    `gender` ENUM('MALE', 'FEMALE', 'OTHER') NULL,
    `activityLevel` ENUM('SEDENTARY', 'LIGHT', 'MODERATE', 'ACTIVE', 'VERY_ACTIVE') NULL DEFAULT 'SEDENTARY',
    `goalType` ENUM('LOSS', 'MAINTAIN', 'GAIN') NULL DEFAULT 'MAINTAIN',
    `calorieGoal` INTEGER NULL,
    `proteinGoalG` DOUBLE NULL,
    `carbsGoalG` DOUBLE NULL,
    `fatGoalG` DOUBLE NULL,
    `waterGoalMl` INTEGER NULL DEFAULT 2000,
    `unitsMetric` BOOLEAN NOT NULL DEFAULT true,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,

    UNIQUE INDEX `User_email_key`(`email`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Habit` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `habitType` ENUM('BOOLEAN', 'QUANTITY', 'DURATION') NOT NULL,
    `frequencyType` ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM') NOT NULL,
    `targetValue` DOUBLE NULL,
    `timesPerPeriod` INTEGER NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NULL,
    `category` VARCHAR(191) NULL,
    `color` VARCHAR(191) NULL,
    `icon` VARCHAR(191) NULL,
    `isArchived` BOOLEAN NOT NULL DEFAULT false,
    `streakGrace` INTEGER NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
    `updatedAt` DATETIME(3) NOT NULL,
    `sortOrder` INTEGER NOT NULL DEFAULT 0,
    `timeOfDay` ENUM('ANY', 'DAY', 'NIGHT') NOT NULL DEFAULT 'ANY',
    `dayOfMonth` INTEGER NULL,
    `daysOfWeek` VARCHAR(191) NULL,
    `yearlyDay` INTEGER NULL,
    `yearlyMonth` INTEGER NULL,

    INDEX `Habit_userId_isArchived_idx`(`userId`, `isArchived`),
    INDEX `Habit_userId_sortOrder_idx`(`userId`, `sortOrder`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HabitLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `habitId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `status` ENUM('COMPLETED', 'PARTIAL', 'MISSED') NOT NULL,
    `value` DOUBLE NULL,
    `notes` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HabitLog_habitId_date_idx`(`habitId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HabitGoal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `habitId` INTEGER NULL,
    `goalScope` ENUM('SHORT_TERM', 'LONG_TERM') NOT NULL,
    `startDate` DATETIME(3) NOT NULL,
    `endDate` DATETIME(3) NOT NULL,
    `target` INTEGER NOT NULL,
    `description` VARCHAR(191) NULL,
    `currentProgress` INTEGER NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `HabitGoal_userId_idx`(`userId`),
    INDEX `HabitGoal_habitId_idx`(`habitId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HabitScheduleDate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `habitId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,

    INDEX `HabitScheduleDate_habitId_date_idx`(`habitId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JournalEntry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `title` VARCHAR(191) NOT NULL,
    `content` VARCHAR(191) NOT NULL,
    `tags` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `JournalEntry_userId_date_idx`(`userId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `JournalEntryHabit` (
    `journalEntryId` INTEGER NOT NULL,
    `habitId` INTEGER NOT NULL,

    INDEX `JournalEntryHabit_habitId_fkey`(`habitId`),
    PRIMARY KEY (`journalEntryId`, `habitId`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `FoodItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `name` VARCHAR(191) NOT NULL,
    `category` VARCHAR(191) NULL,
    `baseServingSizeG` DOUBLE NOT NULL DEFAULT 100,
    `calories` DOUBLE NOT NULL,
    `protein` DOUBLE NOT NULL DEFAULT 0,
    `carbs` DOUBLE NOT NULL DEFAULT 0,
    `fat` DOUBLE NOT NULL DEFAULT 0,
    `fiber` DOUBLE NOT NULL DEFAULT 0,
    `sugar` DOUBLE NOT NULL DEFAULT 0,
    `sodium` DOUBLE NOT NULL DEFAULT 0,
    `vitaminC` DOUBLE NOT NULL DEFAULT 0,
    `iron` DOUBLE NOT NULL DEFAULT 0,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `source` VARCHAR(191) NULL,

    INDEX `FoodItem_name_idx`(`name`),
    INDEX `FoodItem_category_idx`(`category`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `BrandedFoodItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `brandName` VARCHAR(191) NOT NULL,
    `productName` VARCHAR(191) NOT NULL,
    `barcode` VARCHAR(191) NOT NULL,
    `servingSizeG` DOUBLE NOT NULL DEFAULT 100,
    `calories` DOUBLE NOT NULL,
    `protein` DOUBLE NOT NULL DEFAULT 0,
    `carbs` DOUBLE NOT NULL DEFAULT 0,
    `fat` DOUBLE NOT NULL DEFAULT 0,
    `fiber` DOUBLE NOT NULL DEFAULT 0,
    `sugar` DOUBLE NOT NULL DEFAULT 0,
    `sodium` DOUBLE NOT NULL DEFAULT 0,
    `isVerified` BOOLEAN NOT NULL DEFAULT false,
    `source` VARCHAR(191) NULL,

    UNIQUE INDEX `BrandedFoodItem_barcode_key`(`barcode`),
    INDEX `BrandedFoodItem_brandName_idx`(`brandName`),
    INDEX `BrandedFoodItem_productName_idx`(`productName`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `CustomFood` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `servingSizeDesc` VARCHAR(191) NULL,
    `baseServingSizeAmount` DOUBLE NOT NULL DEFAULT 100,
    `baseServingSizeUnit` ENUM('G', 'OZ', 'ML', 'CUP', 'PIECE', 'SLICE') NOT NULL DEFAULT 'G',
    `calories` DOUBLE NOT NULL,
    `protein` DOUBLE NOT NULL DEFAULT 0,
    `carbs` DOUBLE NOT NULL DEFAULT 0,
    `fat` DOUBLE NOT NULL DEFAULT 0,
    `fiber` DOUBLE NOT NULL DEFAULT 0,
    `sugar` DOUBLE NOT NULL DEFAULT 0,
    `sodium` DOUBLE NOT NULL DEFAULT 0,

    INDEX `CustomFood_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Recipe` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `instructions` VARCHAR(191) NULL,
    `numberOfServings` INTEGER NOT NULL DEFAULT 1,
    `caloriesPerServ` DOUBLE NOT NULL DEFAULT 0,
    `proteinPerServ` DOUBLE NOT NULL DEFAULT 0,
    `carbsPerServ` DOUBLE NOT NULL DEFAULT 0,
    `fatPerServ` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Recipe_userId_idx`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `RecipeIngredient` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `recipeId` INTEGER NOT NULL,
    `foodItemId` INTEGER NULL,
    `brandedFoodItemId` INTEGER NULL,
    `customFoodId` INTEGER NULL,
    `quantity` DOUBLE NOT NULL,
    `unit` ENUM('G', 'OZ', 'ML', 'CUP', 'PIECE', 'SLICE') NOT NULL,

    INDEX `RecipeIngredient_recipeId_idx`(`recipeId`),
    INDEX `RecipeIngredient_brandedFoodItemId_fkey`(`brandedFoodItemId`),
    INDEX `RecipeIngredient_customFoodId_fkey`(`customFoodId`),
    INDEX `RecipeIngredient_foodItemId_fkey`(`foodItemId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `UserFoodEntry` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `dateTime` DATETIME(3) NOT NULL,
    `mealType` ENUM('BREAKFAST', 'LUNCH', 'DINNER', 'SNACK') NOT NULL,
    `foodItemId` INTEGER NULL,
    `brandedFoodItemId` INTEGER NULL,
    `customFoodId` INTEGER NULL,
    `recipeId` INTEGER NULL,
    `quantity` DOUBLE NOT NULL,
    `unit` ENUM('G', 'OZ', 'ML', 'CUP', 'PIECE', 'SLICE') NOT NULL,
    `calories` DOUBLE NOT NULL DEFAULT 0,
    `protein` DOUBLE NOT NULL DEFAULT 0,
    `carbs` DOUBLE NOT NULL DEFAULT 0,
    `fat` DOUBLE NOT NULL DEFAULT 0,
    `fiber` DOUBLE NOT NULL DEFAULT 0,
    `sugar` DOUBLE NOT NULL DEFAULT 0,
    `sodium` DOUBLE NOT NULL DEFAULT 0,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `UserFoodEntry_userId_dateTime_idx`(`userId`, `dateTime`),
    INDEX `UserFoodEntry_brandedFoodItemId_fkey`(`brandedFoodItemId`),
    INDEX `UserFoodEntry_customFoodId_fkey`(`customFoodId`),
    INDEX `UserFoodEntry_foodItemId_fkey`(`foodItemId`),
    INDEX `UserFoodEntry_recipeId_fkey`(`recipeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `Meal` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `name` VARCHAR(191) NOT NULL,
    `description` VARCHAR(191) NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `Meal_userId_fkey`(`userId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `MealItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `mealId` INTEGER NOT NULL,
    `foodItemId` INTEGER NULL,
    `brandedFoodItemId` INTEGER NULL,
    `customFoodId` INTEGER NULL,
    `recipeId` INTEGER NULL,
    `quantity` DOUBLE NOT NULL,
    `unit` ENUM('G', 'OZ', 'ML', 'CUP', 'PIECE', 'SLICE') NOT NULL,

    INDEX `MealItem_brandedFoodItemId_fkey`(`brandedFoodItemId`),
    INDEX `MealItem_customFoodId_fkey`(`customFoodId`),
    INDEX `MealItem_foodItemId_fkey`(`foodItemId`),
    INDEX `MealItem_mealId_fkey`(`mealId`),
    INDEX `MealItem_recipeId_fkey`(`recipeId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WaterLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `dateTime` DATETIME(3) NOT NULL,
    `amount` DOUBLE NOT NULL,
    `unit` ENUM('G', 'OZ', 'ML', 'CUP', 'PIECE', 'SLICE') NOT NULL DEFAULT 'ML',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WaterLog_userId_dateTime_idx`(`userId`, `dateTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `ExerciseLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `dateTime` DATETIME(3) NOT NULL,
    `exerciseType` VARCHAR(191) NOT NULL,
    `durationMin` INTEGER NOT NULL,
    `caloriesBurned` DOUBLE NOT NULL,
    `source` ENUM('MANUAL', 'APPLE_HEALTH', 'GOOGLE_FIT', 'FITBIT', 'GARMIN', 'OTHER') NOT NULL DEFAULT 'MANUAL',
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `ExerciseLog_userId_dateTime_idx`(`userId`, `dateTime`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `WeightLog` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `userId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,
    `weightKg` DOUBLE NOT NULL,
    `createdAt` DATETIME(3) NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

    INDEX `WeightLog_userId_date_idx`(`userId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable
CREATE TABLE `HabitGoalItem` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `habitGoalId` INTEGER NOT NULL,
    `habitId` INTEGER NOT NULL,
    `targetCount` INTEGER NOT NULL,
    `weight` DOUBLE NOT NULL DEFAULT 1,

    INDEX `HabitGoalItem_habitGoalId_idx`(`habitGoalId`),
    INDEX `HabitGoalItem_habitId_idx`(`habitId`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Habit` ADD CONSTRAINT `Habit_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HabitLog` ADD CONSTRAINT `HabitLog_habitId_fkey` FOREIGN KEY (`habitId`) REFERENCES `Habit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HabitGoal` ADD CONSTRAINT `HabitGoal_habitId_fkey` FOREIGN KEY (`habitId`) REFERENCES `Habit`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HabitGoal` ADD CONSTRAINT `HabitGoal_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HabitScheduleDate` ADD CONSTRAINT `HabitScheduleDate_habitId_fkey` FOREIGN KEY (`habitId`) REFERENCES `Habit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JournalEntry` ADD CONSTRAINT `JournalEntry_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JournalEntryHabit` ADD CONSTRAINT `JournalEntryHabit_habitId_fkey` FOREIGN KEY (`habitId`) REFERENCES `Habit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `JournalEntryHabit` ADD CONSTRAINT `JournalEntryHabit_journalEntryId_fkey` FOREIGN KEY (`journalEntryId`) REFERENCES `JournalEntry`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `CustomFood` ADD CONSTRAINT `CustomFood_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Recipe` ADD CONSTRAINT `Recipe_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecipeIngredient` ADD CONSTRAINT `RecipeIngredient_brandedFoodItemId_fkey` FOREIGN KEY (`brandedFoodItemId`) REFERENCES `BrandedFoodItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecipeIngredient` ADD CONSTRAINT `RecipeIngredient_customFoodId_fkey` FOREIGN KEY (`customFoodId`) REFERENCES `CustomFood`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecipeIngredient` ADD CONSTRAINT `RecipeIngredient_foodItemId_fkey` FOREIGN KEY (`foodItemId`) REFERENCES `FoodItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RecipeIngredient` ADD CONSTRAINT `RecipeIngredient_recipeId_fkey` FOREIGN KEY (`recipeId`) REFERENCES `Recipe`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserFoodEntry` ADD CONSTRAINT `UserFoodEntry_brandedFoodItemId_fkey` FOREIGN KEY (`brandedFoodItemId`) REFERENCES `BrandedFoodItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserFoodEntry` ADD CONSTRAINT `UserFoodEntry_customFoodId_fkey` FOREIGN KEY (`customFoodId`) REFERENCES `CustomFood`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserFoodEntry` ADD CONSTRAINT `UserFoodEntry_foodItemId_fkey` FOREIGN KEY (`foodItemId`) REFERENCES `FoodItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserFoodEntry` ADD CONSTRAINT `UserFoodEntry_recipeId_fkey` FOREIGN KEY (`recipeId`) REFERENCES `Recipe`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `UserFoodEntry` ADD CONSTRAINT `UserFoodEntry_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Meal` ADD CONSTRAINT `Meal_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MealItem` ADD CONSTRAINT `MealItem_brandedFoodItemId_fkey` FOREIGN KEY (`brandedFoodItemId`) REFERENCES `BrandedFoodItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MealItem` ADD CONSTRAINT `MealItem_customFoodId_fkey` FOREIGN KEY (`customFoodId`) REFERENCES `CustomFood`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MealItem` ADD CONSTRAINT `MealItem_foodItemId_fkey` FOREIGN KEY (`foodItemId`) REFERENCES `FoodItem`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MealItem` ADD CONSTRAINT `MealItem_mealId_fkey` FOREIGN KEY (`mealId`) REFERENCES `Meal`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `MealItem` ADD CONSTRAINT `MealItem_recipeId_fkey` FOREIGN KEY (`recipeId`) REFERENCES `Recipe`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WaterLog` ADD CONSTRAINT `WaterLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `ExerciseLog` ADD CONSTRAINT `ExerciseLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `WeightLog` ADD CONSTRAINT `WeightLog_userId_fkey` FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HabitGoalItem` ADD CONSTRAINT `HabitGoalItem_habitGoalId_fkey` FOREIGN KEY (`habitGoalId`) REFERENCES `HabitGoal`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HabitGoalItem` ADD CONSTRAINT `HabitGoalItem_habitId_fkey` FOREIGN KEY (`habitId`) REFERENCES `Habit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
