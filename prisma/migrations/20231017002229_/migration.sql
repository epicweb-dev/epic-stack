/*
  Warnings:

  - You are about to drop the column `userId` on the `Student` table. All the data in the column will be lost.
  - You are about to drop the column `enrollmentDate` on the `Enrollment` table. All the data in the column will be lost.
  - You are about to drop the column `enrollmentType` on the `Enrollment` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Teacher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "teacherProfileUserId" TEXT,
    CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Teacher_teacherProfileUserId_fkey" FOREIGN KEY ("teacherProfileUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Teacher" ("id", "userId") SELECT "id", "userId" FROM "Teacher";
DROP TABLE "Teacher";
ALTER TABLE "new_Teacher" RENAME TO "Teacher";
CREATE UNIQUE INDEX "Teacher_teacherProfileUserId_key" ON "Teacher"("teacherProfileUserId");
CREATE TABLE "new_Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "studentProfileUserId" TEXT,
    CONSTRAINT "Student_studentProfileUserId_fkey" FOREIGN KEY ("studentProfileUserId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Student" ("id") SELECT "id" FROM "Student";
DROP TABLE "Student";
ALTER TABLE "new_Student" RENAME TO "Student";
CREATE UNIQUE INDEX "Student_studentProfileUserId_key" ON "Student"("studentProfileUserId");
CREATE TABLE "new_Enrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "teacherId" TEXT,
    "studentId" TEXT,
    CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Enrollment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Enrollment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Enrollment" ("id", "schoolId", "studentId", "teacherId", "userId") SELECT "id", "schoolId", "studentId", "teacherId", "userId" FROM "Enrollment";
DROP TABLE "Enrollment";
ALTER TABLE "new_Enrollment" RENAME TO "Enrollment";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
