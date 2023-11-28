/*
  Warnings:

  - You are about to drop the `Enrollment` table. If the table is not empty, all the data it contains will be lost.
  - You are about to drop the column `userTeacherId` on the `Teacher` table. All the data in the column will be lost.
  - Made the column `userId` on table `Teacher` required. This step will fail if there are existing NULL values in that column.

*/
-- DropTable
PRAGMA foreign_keys=off;
DROP TABLE "Enrollment";
PRAGMA foreign_keys=on;

-- CreateTable
CREATE TABLE "Application" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "applicationType" TEXT NOT NULL,
    CONSTRAINT "Application_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Application_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "schoolId" TEXT NOT NULL,
    "userId" TEXT,
    CONSTRAINT "Event_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Event_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Event" ("endTime", "id", "schoolId", "startTime") SELECT "endTime", "id", "schoolId", "startTime" FROM "Event";
DROP TABLE "Event";
ALTER TABLE "new_Event" RENAME TO "Event";
CREATE TABLE "new_Teacher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Teacher" ("id", "userId") SELECT "id", "userId" FROM "Teacher";
DROP TABLE "Teacher";
ALTER TABLE "new_Teacher" RENAME TO "Teacher";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
