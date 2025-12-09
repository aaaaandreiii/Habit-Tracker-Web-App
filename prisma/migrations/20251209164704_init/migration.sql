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
ALTER TABLE `HabitGoalItem` ADD CONSTRAINT `HabitGoalItem_habitGoalId_fkey` FOREIGN KEY (`habitGoalId`) REFERENCES `HabitGoal`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `HabitGoalItem` ADD CONSTRAINT `HabitGoalItem_habitId_fkey` FOREIGN KEY (`habitId`) REFERENCES `Habit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
