-- AlterTable
ALTER TABLE `Habit` ADD COLUMN `dayOfMonth` INTEGER NULL,
    ADD COLUMN `daysOfWeek` VARCHAR(191) NULL,
    ADD COLUMN `yearlyDay` INTEGER NULL,
    ADD COLUMN `yearlyMonth` INTEGER NULL,
    MODIFY `frequencyType` ENUM('DAILY', 'WEEKLY', 'MONTHLY', 'YEARLY', 'CUSTOM') NOT NULL;

-- CreateTable
CREATE TABLE `HabitScheduleDate` (
    `id` INTEGER NOT NULL AUTO_INCREMENT,
    `habitId` INTEGER NOT NULL,
    `date` DATETIME(3) NOT NULL,

    INDEX `HabitScheduleDate_habitId_date_idx`(`habitId`, `date`),
    PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `HabitScheduleDate` ADD CONSTRAINT `HabitScheduleDate_habitId_fkey` FOREIGN KEY (`habitId`) REFERENCES `Habit`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
