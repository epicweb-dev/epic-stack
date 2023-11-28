-- CreateTable
CREATE TABLE "Teacher" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    CONSTRAINT "Teacher_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Student" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT,
    CONSTRAINT "Student_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "School" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "School_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Enrollment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "schoolId" TEXT NOT NULL,
    "enrollmentDate" DATETIME NOT NULL,
    "enrollmentType" TEXT NOT NULL,
    "teacherId" TEXT,
    "studentId" TEXT,
    CONSTRAINT "Enrollment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Enrollment_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Enrollment_teacherId_fkey" FOREIGN KEY ("teacherId") REFERENCES "Teacher" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Enrollment_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "Student" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Event" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "schoolId" TEXT NOT NULL,
    CONSTRAINT "Event_schoolId_fkey" FOREIGN KEY ("schoolId") REFERENCES "School" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_TeacherSchools" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_TeacherSchools_A_fkey" FOREIGN KEY ("A") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TeacherSchools_B_fkey" FOREIGN KEY ("B") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_StudentSchools" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_StudentSchools_A_fkey" FOREIGN KEY ("A") REFERENCES "School" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_StudentSchools_B_fkey" FOREIGN KEY ("B") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_TeacherScheduledEvents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_TeacherScheduledEvents_A_fkey" FOREIGN KEY ("A") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_TeacherScheduledEvents_B_fkey" FOREIGN KEY ("B") REFERENCES "Teacher" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "_StudentScheduledEvents" (
    "A" TEXT NOT NULL,
    "B" TEXT NOT NULL,
    CONSTRAINT "_StudentScheduledEvents_A_fkey" FOREIGN KEY ("A") REFERENCES "Event" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "_StudentScheduledEvents_B_fkey" FOREIGN KEY ("B") REFERENCES "Student" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Student_userId_key" ON "Student"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "_TeacherSchools_AB_unique" ON "_TeacherSchools"("A", "B");

-- CreateIndex
CREATE INDEX "_TeacherSchools_B_index" ON "_TeacherSchools"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_StudentSchools_AB_unique" ON "_StudentSchools"("A", "B");

-- CreateIndex
CREATE INDEX "_StudentSchools_B_index" ON "_StudentSchools"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_TeacherScheduledEvents_AB_unique" ON "_TeacherScheduledEvents"("A", "B");

-- CreateIndex
CREATE INDEX "_TeacherScheduledEvents_B_index" ON "_TeacherScheduledEvents"("B");

-- CreateIndex
CREATE UNIQUE INDEX "_StudentScheduledEvents_AB_unique" ON "_StudentScheduledEvents"("A", "B");

-- CreateIndex
CREATE INDEX "_StudentScheduledEvents_B_index" ON "_StudentScheduledEvents"("B");
