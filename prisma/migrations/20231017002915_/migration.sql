/*
  Warnings:

  - You are about to drop the column `studentProfileUserId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `teacherProfileUserId` on the `Teacher` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("id") SELECT "id" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");
CREATE TABLE "new_Teacher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userTeacherId" TEXT,
    "userId" TEXT,
    CONSTRAINT "Teacher_userTeacherId_fkey" FOREIGN KEY ("userTeacherId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Teacher" ("id", "userId") SELECT "id", "userId" FROM "Teacher";
DROP TABLE "Teacher";
ALTER TABLE "new_Teacher" RENAME TO "Teacher";
CREATE UNIQUE INDEX "Teacher_userId_key" ON "Teacher"("userId");
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
