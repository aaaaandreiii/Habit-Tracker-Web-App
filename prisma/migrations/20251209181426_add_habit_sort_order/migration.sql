-- AlterTable
ALTER TABLE `Habit` ADD COLUMN `sortOrder` INTEGER NOT NULL DEFAULT 0;

-- CreateIndex
CREATE INDEX `Habit_userId_sortOrder_idx` ON `Habit`(`userId`, `sortOrder`);
