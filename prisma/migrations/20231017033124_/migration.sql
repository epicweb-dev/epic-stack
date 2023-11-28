/*
  Warnings:

  - You are about to drop the column `title` on the `School` table. All the data in the column will be lost.
  - Added the required column `name` to the `School` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_School" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    "ownerId" TEXT NOT NULL,
    CONSTRAINT "School_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_School" ("createdAt", "id", "ownerId", "updatedAt") SELECT "createdAt", "id", "ownerId", "updatedAt" FROM "School";
DROP TABLE "School";
ALTER TABLE "new_School" RENAME TO "School";
PRAGMA foreign_key_check;
PRAGMA foreign_keys=ON;
