CREATE TABLE `Connection` (
	`id` text PRIMARY KEY NOT NULL,
	`providerName` text NOT NULL,
	`providerId` text NOT NULL,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Connection_providerName_providerId_key` ON `Connection` (`providerName`,`providerId`);--> statement-breakpoint
CREATE TABLE `Note` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`content` text NOT NULL,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`ownerId` text NOT NULL,
	FOREIGN KEY (`ownerId`) REFERENCES `User`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `Note_ownerId_updatedAt_idx` ON `Note` (`ownerId`,`updatedAt`);--> statement-breakpoint
CREATE INDEX `Note_ownerId_idx` ON `Note` (`ownerId`);--> statement-breakpoint
CREATE TABLE `NoteImage` (
	`id` text PRIMARY KEY NOT NULL,
	`altText` text,
	`contentType` text NOT NULL,
	`blob` blob NOT NULL,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`noteId` text NOT NULL,
	FOREIGN KEY (`noteId`) REFERENCES `Note`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `NoteImage_noteId_idx` ON `NoteImage` (`noteId`);--> statement-breakpoint
CREATE TABLE `Password` (
	`hash` text NOT NULL,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Password_userId_key` ON `Password` (`userId`);--> statement-breakpoint
CREATE TABLE `Permission` (
	`id` text PRIMARY KEY NOT NULL,
	`action` text NOT NULL,
	`entity` text NOT NULL,
	`access` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Permission_action_entity_access_key` ON `Permission` (`action`,`entity`,`access`);--> statement-breakpoint
CREATE TABLE `_PermissionToRole` (
	`permissionId` text NOT NULL,
	`roleId` text NOT NULL,
	PRIMARY KEY(`permissionId`, `roleId`),
	FOREIGN KEY (`permissionId`) REFERENCES `Permission`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `PermissionToRole_roleId_idx` ON `_PermissionToRole` (`roleId`);--> statement-breakpoint
CREATE TABLE `Role` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text DEFAULT '' NOT NULL,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Role_name_key` ON `Role` (`name`);--> statement-breakpoint
CREATE TABLE `_RoleToUser` (
	`roleId` text NOT NULL,
	`userId` text NOT NULL,
	PRIMARY KEY(`userId`, `roleId`),
	FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON UPDATE cascade ON DELETE cascade,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `RoleToUser_userId_idx` ON `_RoleToUser` (`userId`);--> statement-breakpoint
CREATE TABLE `Session` (
	`id` text PRIMARY KEY NOT NULL,
	`expirationDate` integer NOT NULL,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE INDEX `Session_userId_idx` ON `Session` (`userId`);--> statement-breakpoint
CREATE TABLE `User` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`username` text NOT NULL,
	`name` text,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `User_email_key` ON `User` (`email`);--> statement-breakpoint
CREATE UNIQUE INDEX `User_username_key` ON `User` (`username`);--> statement-breakpoint
CREATE TABLE `UserImage` (
	`id` text PRIMARY KEY NOT NULL,
	`altText` text,
	`contentType` text NOT NULL,
	`blob` blob NOT NULL,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`updatedAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`userId` text NOT NULL,
	FOREIGN KEY (`userId`) REFERENCES `User`(`id`) ON UPDATE cascade ON DELETE cascade
);
--> statement-breakpoint
CREATE UNIQUE INDEX `UserImage_userId_key` ON `UserImage` (`userId`);--> statement-breakpoint
CREATE TABLE `Verification` (
	`id` text PRIMARY KEY NOT NULL,
	`createdAt` integer DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	`type` text NOT NULL,
	`target` text NOT NULL,
	`secret` text NOT NULL,
	`algorithm` text NOT NULL,
	`digits` integer NOT NULL,
	`period` integer NOT NULL,
	`charSet` text NOT NULL,
	`expiresAt` integer
);
--> statement-breakpoint
CREATE UNIQUE INDEX `Verification_target_type_key` ON `Verification` (`target`,`type`);
--> statement-breakpoint

--------------------------------- Manual Seeding --------------------------
-- Hey there, Kent here! This is how you can reliably seed your database with
-- some data. You edit the migration.sql file and that will handle it for you.

-- The user Roles and Permissions are seeded here.
-- If you'd like to customise roles and permissions, you can edit and add the code below to your `drizzle/seed.ts` file.
-- Seed your development database with `npm run db:seed`
-- Create a sql dump of your database with `sqlite3 drizzle/data.db .dump > seed.sql`
-- Replace the SQL below with your new Roles & Permissions related SQL from `seed.sql`

-- console.time('🔑 Created permissions...')
-- const entities = ['user', 'note']
-- const actions = ['create', 'read', 'update', 'delete']
-- const accesses = ['own', 'any'] as const

-- let permissionsToCreate = []
-- for (const entity of entities) {
-- 	for (const action of actions) {
-- 		for (const access of accesses) {
-- 			permissionsToCreate.push({ entity, action, access })
-- 		}
-- 	}
-- }
-- await drizzle.insert(Permission).values(permissionsToCreate).returning()
-- console.timeEnd('🔑 Created permissions...')

-- console.time('👑 Created roles...')
-- const [adminRole] = await drizzle
-- 	.insert(Role)
-- 	.values({
-- 		name: 'admin',
-- 	})
-- 	.returning()
-- invariant(adminRole, 'Failed to create admin role')

-- await drizzle.insert(PermissionToRole).select(
-- 	drizzle
-- 		.select({
-- 			permissionId: Permission.id,
-- 			roleId: sql.raw(`'${adminRole.id}'`).as('roleId'),
-- 		})
-- 		.from(Permission)
-- 		.where(eq(Permission.access, 'any')),
-- )

-- const [userRole] = await drizzle
-- 	.insert(Role)
-- 	.values({
-- 		name: 'user',
-- 	})
-- 	.returning()
-- invariant(userRole, 'Failed to create user role')
-- await drizzle.insert(PermissionToRole).select(
-- 	drizzle
-- 		.select({
-- 			permissionId: Permission.id,
-- 			roleId: sql.raw(`'${userRole.id}'`).as('roleId'),
-- 		})
-- 		.from(Permission)
-- 		.where(eq(Permission.access, 'own')),
-- )

-- console.timeEnd('👑 Created roles...')

INSERT INTO Role VALUES('eyjijd54btei76u7rseipyq3','admin','','2024-11-29 17:44:04','2024-11-29 17:44:04'); --> statement-breakpoint
INSERT INTO Role VALUES('e4uz7vf8gviijs66uyr7sx7s','user','','2024-11-29 17:44:04','2024-11-29 17:44:04'); --> statement-breakpoint

INSERT INTO Permission VALUES('dtsymwtvluku98ha2uawlihd','create','user','own','','2024-11-29 17:44:04','2024-11-29 17:44:04'); --> statement-breakpoint
INSERT INTO Permission VALUES('rmbfq3extuik9ut55d7jx0sq','create','user','any','','2024-11-29 17:44:04','2024-11-29 17:44:04'); --> statement-breakpoint
INSERT INTO Permission VALUES('egv7dx17tgea96vgn4v1r8dw','read','user','own','','2024-11-29 17:44:04','2024-11-29 17:44:04'); --> statement-breakpoint
INSERT INTO Permission VALUES('nu87ab9me532woymbs9d3giz','read','user','any','','2024-11-29 17:44:04','2024-11-29 17:44:04'); --> statement-breakpoint
INSERT INTO Permission VALUES('cjr3xxvsgukymelxlevwrc26','update','user','own','','2024-11-29 17:44:04','2024-11-29 17:44:04'); --> statement-breakpoint
INSERT INTO Permission VALUES('jcn179nd14mq7wmza434b75d','update','user','any','','2024-11-29 17:44:04','2024-11-29 17:44:04'); --> statement-breakpoint
INSERT INTO Permission VALUES('p265ov9icwscdvf61tk1udql','delete','user','own','','2024-11-29 17:44:04','2024-11-29 17:44:04'); --> statement-breakpoint
INSERT INTO Permission VALUES('bo351072k7jrehmcrgowemd4','delete','user','any','','2024-11-29 17:44:04','2024-11-29 17:44:04'); --> statement-breakpoint
INSERT INTO Permission VALUES('paub7xgb2yearnmh5y3dgfpi','create','note','own','','2024-11-29 17:44:04','2024-11-29 17:44:04'); --> statement-breakpoint
INSERT INTO Permission VALUES('bcodgq69ultjmps1hhgk8tpz','create','note','any','','2024-11-29 17:44:04','2024-11-29 17:44:04'); --> statement-breakpoint
INSERT INTO Permission VALUES('gg5cw1jx59doqz4rafbvc5fe','read','note','own','','2024-11-29 17:44:04','2024-11-29 17:44:04'); --> statement-breakpoint
INSERT INTO Permission VALUES('tli9r72rx6ghv1qaevbs8268','read','note','any','','2024-11-29 17:44:04','2024-11-29 17:44:04'); --> statement-breakpoint
INSERT INTO Permission VALUES('kbr9jj55cvcway9s3diuure0','update','note','own','','2024-11-29 17:44:04','2024-11-29 17:44:04'); --> statement-breakpoint
INSERT INTO Permission VALUES('w4alk7ejfkpdlsf94tiay5ou','update','note','any','','2024-11-29 17:44:04','2024-11-29 17:44:04'); --> statement-breakpoint
INSERT INTO Permission VALUES('ne3hyy0g81tsnndj4grqfbqh','delete','note','own','','2024-11-29 17:44:04','2024-11-29 17:44:04'); --> statement-breakpoint
INSERT INTO Permission VALUES('lzdrlc3lzmsdfkjg150tgveb','delete','note','any','','2024-11-29 17:44:04','2024-11-29 17:44:04'); --> statement-breakpoint

INSERT INTO _PermissionToRole VALUES('rmbfq3extuik9ut55d7jx0sq','eyjijd54btei76u7rseipyq3'); --> statement-breakpoint
INSERT INTO _PermissionToRole VALUES('nu87ab9me532woymbs9d3giz','eyjijd54btei76u7rseipyq3'); --> statement-breakpoint
INSERT INTO _PermissionToRole VALUES('jcn179nd14mq7wmza434b75d','eyjijd54btei76u7rseipyq3'); --> statement-breakpoint
INSERT INTO _PermissionToRole VALUES('bo351072k7jrehmcrgowemd4','eyjijd54btei76u7rseipyq3'); --> statement-breakpoint
INSERT INTO _PermissionToRole VALUES('bcodgq69ultjmps1hhgk8tpz','eyjijd54btei76u7rseipyq3'); --> statement-breakpoint
INSERT INTO _PermissionToRole VALUES('tli9r72rx6ghv1qaevbs8268','eyjijd54btei76u7rseipyq3'); --> statement-breakpoint
INSERT INTO _PermissionToRole VALUES('w4alk7ejfkpdlsf94tiay5ou','eyjijd54btei76u7rseipyq3'); --> statement-breakpoint
INSERT INTO _PermissionToRole VALUES('lzdrlc3lzmsdfkjg150tgveb','eyjijd54btei76u7rseipyq3'); --> statement-breakpoint
INSERT INTO _PermissionToRole VALUES('dtsymwtvluku98ha2uawlihd','e4uz7vf8gviijs66uyr7sx7s'); --> statement-breakpoint
INSERT INTO _PermissionToRole VALUES('egv7dx17tgea96vgn4v1r8dw','e4uz7vf8gviijs66uyr7sx7s'); --> statement-breakpoint
INSERT INTO _PermissionToRole VALUES('cjr3xxvsgukymelxlevwrc26','e4uz7vf8gviijs66uyr7sx7s'); --> statement-breakpoint
INSERT INTO _PermissionToRole VALUES('p265ov9icwscdvf61tk1udql','e4uz7vf8gviijs66uyr7sx7s'); --> statement-breakpoint
INSERT INTO _PermissionToRole VALUES('paub7xgb2yearnmh5y3dgfpi','e4uz7vf8gviijs66uyr7sx7s'); --> statement-breakpoint
INSERT INTO _PermissionToRole VALUES('gg5cw1jx59doqz4rafbvc5fe','e4uz7vf8gviijs66uyr7sx7s'); --> statement-breakpoint
INSERT INTO _PermissionToRole VALUES('kbr9jj55cvcway9s3diuure0','e4uz7vf8gviijs66uyr7sx7s'); --> statement-breakpoint
INSERT INTO _PermissionToRole VALUES('ne3hyy0g81tsnndj4grqfbqh','e4uz7vf8gviijs66uyr7sx7s');