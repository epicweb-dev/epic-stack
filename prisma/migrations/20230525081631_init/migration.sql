-- CreateTable
CREATE TABLE
	"File" (
		"id" TEXT NOT NULL PRIMARY KEY,
		"blob" BLOB NOT NULL,
		"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		"updatedAt" DATETIME NOT NULL
	);

-- CreateTable
CREATE TABLE
	"Image" (
		"fileId" TEXT NOT NULL,
		"contentType" TEXT NOT NULL,
		"altText" TEXT,
		"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		"updatedAt" DATETIME NOT NULL,
		CONSTRAINT "Image_fileId_fkey" FOREIGN KEY ("fileId") REFERENCES "File" ("id") ON DELETE CASCADE ON UPDATE CASCADE
	);

-- CreateTable
CREATE TABLE
	"Role" (
		"id" TEXT NOT NULL PRIMARY KEY,
		"name" TEXT NOT NULL,
		"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		"updatedAt" DATETIME NOT NULL
	);

-- CreateTable
CREATE TABLE
	"Permission" (
		"id" TEXT NOT NULL PRIMARY KEY,
		"name" TEXT NOT NULL,
		"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		"updatedAt" DATETIME NOT NULL
	);

-- CreateTable
CREATE TABLE
	"User" (
		"id" TEXT NOT NULL PRIMARY KEY,
		"email" TEXT NOT NULL,
		"username" TEXT NOT NULL,
		"name" TEXT,
		"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		"updatedAt" DATETIME NOT NULL,
		"imageId" TEXT,
		CONSTRAINT "User_imageId_fkey" FOREIGN KEY ("imageId") REFERENCES "Image" ("fileId") ON DELETE SET NULL ON UPDATE CASCADE
	);

-- CreateTable
CREATE TABLE
	"Password" (
		"hash" TEXT NOT NULL,
		"userId" TEXT NOT NULL,
		CONSTRAINT "Password_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
	);

-- CreateTable
CREATE TABLE
	"Session" (
		"id" TEXT NOT NULL PRIMARY KEY,
		"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		"userId" TEXT NOT NULL,
		"expirationDate" DATETIME NOT NULL,
		CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
	);

-- CreateTable
CREATE TABLE
	"Note" (
		"id" TEXT NOT NULL PRIMARY KEY,
		"title" TEXT NOT NULL,
		"content" TEXT NOT NULL,
		"createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
		"updatedAt" DATETIME NOT NULL,
		"ownerId" TEXT NOT NULL,
		CONSTRAINT "Note_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
	);

-- CreateTable
CREATE TABLE
	"_RoleToUser" (
		"A" TEXT NOT NULL,
		"B" TEXT NOT NULL,
		CONSTRAINT "_RoleToUser_A_fkey" FOREIGN KEY ("A") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
		CONSTRAINT "_RoleToUser_B_fkey" FOREIGN KEY ("B") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
	);

-- CreateTable
CREATE TABLE
	"_PermissionToRole" (
		"A" TEXT NOT NULL,
		"B" TEXT NOT NULL,
		CONSTRAINT "_PermissionToRole_A_fkey" FOREIGN KEY ("A") REFERENCES "Permission" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
		CONSTRAINT "_PermissionToRole_B_fkey" FOREIGN KEY ("B") REFERENCES "Role" ("id") ON DELETE CASCADE ON UPDATE CASCADE
	);

-- CreateIndex
CREATE UNIQUE INDEX "File_id_key" ON "File" ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Image_fileId_key" ON "Image" ("fileId");

-- CreateIndex
CREATE UNIQUE INDEX "Role_id_key" ON "Role" ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Role_name_key" ON "Role" ("name");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_id_key" ON "Permission" ("id");

-- CreateIndex
CREATE UNIQUE INDEX "Permission_name_key" ON "Permission" ("name");

-- CreateIndex
CREATE UNIQUE INDEX "User_id_key" ON "User" ("id");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User" ("email");

-- CreateIndex
CREATE UNIQUE INDEX "User_username_key" ON "User" ("username");

-- CreateIndex
CREATE UNIQUE INDEX "User_imageId_key" ON "User" ("imageId");

-- CreateIndex
CREATE UNIQUE INDEX "Password_userId_key" ON "Password" ("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Note_id_key" ON "Note" ("id");

-- CreateIndex
CREATE UNIQUE INDEX "_RoleToUser_AB_unique" ON "_RoleToUser" ("A", "B");

-- CreateIndex
CREATE INDEX "_RoleToUser_B_index" ON "_RoleToUser" ("B");

-- CreateIndex
CREATE UNIQUE INDEX "_PermissionToRole_AB_unique" ON "_PermissionToRole" ("A", "B");

-- CreateIndex
CREATE INDEX "_PermissionToRole_B_index" ON "_PermissionToRole" ("B");
