import { createId } from '@paralleldrive/cuid2'
import { relations, sql } from 'drizzle-orm'
import {
	text,
	integer,
	blob,
	sqliteTable,
	primaryKey,
	index,
	uniqueIndex,
} from 'drizzle-orm/sqlite-core'

export const User = sqliteTable('User', {
	id: text()
		.primaryKey()
		.$defaultFn(() => createId()),
	email: text().notNull().unique('User_email_key'),
	username: text().notNull().unique('User_username_key'),
	name: text(),
	createdAt: integer({ mode: 'timestamp' })
		.default(sql`(unixepoch())`)
		.notNull(),
	updatedAt: integer({ mode: 'timestamp' })
		.default(sql`(unixepoch())`)
		.notNull(),
})

export const Note = sqliteTable(
	'Note',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => createId()),
		title: text().notNull(),
		content: text().notNull(),
		createdAt: integer({ mode: 'timestamp' })
			.default(sql`(unixepoch())`)
			.notNull(),
		updatedAt: integer({ mode: 'timestamp' })
			.default(sql`(unixepoch())`)
			.notNull(),
		ownerId: text()
			.notNull()
			.references(() => User.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	},
	(table) => ({
		ownerIdUpdatedAtIdx: index('Note_ownerId_updatedAt_idx').on(
			table.ownerId,
			table.updatedAt,
		),
		ownerIdIdx: index('Note_ownerId_idx').on(table.ownerId),
	}),
)

export const NoteImage = sqliteTable(
	'NoteImage',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => createId()),
		altText: text(),
		contentType: text().notNull(),
		blob: blob({ mode: 'buffer' }).notNull(),
		createdAt: integer({ mode: 'timestamp' })
			.default(sql`(unixepoch())`)
			.notNull(),
		updatedAt: integer({ mode: 'timestamp' })
			.default(sql`(unixepoch())`)
			.notNull(),
		noteId: text()
			.notNull()
			.references(() => Note.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	},
	(table) => ({
		noteIdIdx: index('NoteImage_noteId_idx').on(table.noteId),
	}),
)

export const UserImage = sqliteTable('UserImage', {
	id: text()
		.primaryKey()
		.$defaultFn(() => createId()),
	altText: text(),
	contentType: text().notNull(),
	blob: blob({ mode: 'buffer' }).notNull(),
	createdAt: integer({ mode: 'timestamp' })
		.default(sql`(unixepoch())`)
		.notNull(),
	updatedAt: integer({ mode: 'timestamp' })
		.default(sql`(unixepoch())`)
		.notNull(),
	userId: text()
		.notNull()
		.unique('UserImage_userId_key')
		.references(() => User.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
})

export const Password = sqliteTable('Password', {
	hash: text().notNull(),
	userId: text()
		.notNull()
		.unique('Password_userId_key')
		.references(() => User.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
})

export const Session = sqliteTable(
	'Session',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => createId()),
		expirationDate: integer({ mode: 'timestamp' }).notNull(),
		createdAt: integer({ mode: 'timestamp' })
			.default(sql`(unixepoch())`)
			.notNull(),
		updatedAt: integer({ mode: 'timestamp' })
			.default(sql`(unixepoch())`)
			.notNull(),
		userId: text()
			.notNull()
			.references(() => User.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	},
	(table) => ({
		userIdIdx: index('Session_userId_idx').on(table.userId),
	}),
)

export const Permission = sqliteTable(
	'Permission',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => createId()),
		action: text().notNull(),
		entity: text().notNull(),
		access: text().notNull(),
		description: text().default('').notNull(),
		createdAt: integer({ mode: 'timestamp' })
			.default(sql`(unixepoch())`)
			.notNull(),
		updatedAt: integer({ mode: 'timestamp' })
			.default(sql`(unixepoch())`)
			.notNull(),
	},
	(table) => ({
		actionEntityAccessKey: uniqueIndex(
			'Permission_action_entity_access_key',
		).on(table.action, table.entity, table.access),
	}),
)

export const Role = sqliteTable('Role', {
	id: text()
		.primaryKey()
		.$defaultFn(() => createId()),
	name: text().notNull().unique('Role_name_key'),
	description: text().default('').notNull(),
	createdAt: integer({ mode: 'timestamp' })
		.default(sql`(unixepoch())`)
		.notNull(),
	updatedAt: integer({ mode: 'timestamp' })
		.default(sql`(unixepoch())`)
		.notNull(),
})

export const Verification = sqliteTable(
	'Verification',
	{
		id: text('id')
			.primaryKey()
			.$defaultFn(() => createId()),
		createdAt: integer({ mode: 'timestamp' })
			.default(sql`(unixepoch())`)
			.notNull(),
		type: text().notNull(),
		target: text().notNull(),
		secret: text().notNull(),
		algorithm: text().notNull(),
		digits: integer().notNull(),
		period: integer().notNull(),
		charSet: text().notNull(),
		expiresAt: integer({ mode: 'timestamp' }),
	},
	(table) => ({
		targetTypeKey: uniqueIndex('Verification_target_type_key').on(
			table.target,
			table.type,
		),
	}),
)

export const Connection = sqliteTable(
	'Connection',
	{
		id: text()
			.primaryKey()
			.$defaultFn(() => createId()),
		providerName: text().notNull(),
		providerId: text().notNull(),
		createdAt: integer({ mode: 'timestamp' })
			.default(sql`(unixepoch())`)
			.notNull(),
		updatedAt: integer({ mode: 'timestamp' })
			.default(sql`(unixepoch())`)
			.notNull(),
		userId: text()
			.notNull()
			.references(() => User.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	},
	(table) => ({
		providerNameProviderIdKey: uniqueIndex(
			'Connection_providerName_providerId_key',
		).on(table.providerName, table.providerId),
	}),
)

export const PermissionToRole = sqliteTable(
	'_PermissionToRole',
	{
		permissionId: text()
			.notNull()
			.references(() => Permission.id, {
				onDelete: 'cascade',
				onUpdate: 'cascade',
			}),
		roleId: text()
			.notNull()
			.references(() => Role.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	},
	(table) => ({
		roleIdIdx: index('PermissionToRole_roleId_idx').on(table.roleId),
		pk: primaryKey({ columns: [table.permissionId, table.roleId] }),
	}),
)

export const RoleToUser = sqliteTable(
	'_RoleToUser',
	{
		roleId: text()
			.notNull()
			.references(() => Role.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
		userId: text()
			.notNull()
			.references(() => User.id, { onDelete: 'cascade', onUpdate: 'cascade' }),
	},
	(table) => ({
		userIdIdx: index('RoleToUser_userId_idx').on(table.userId),
		pk: primaryKey({ columns: [table.userId, table.roleId] }),
	}),
)

// Relations

export const noteRelations = relations(Note, ({ one, many }) => ({
	owner: one(User, {
		fields: [Note.ownerId],
		references: [User.id],
	}),
	images: many(NoteImage),
}))

export const userRelations = relations(User, ({ one, many }) => ({
	notes: many(Note),
	image: one(UserImage),
	password: one(Password),
	sessions: many(Session),
	connections: many(Connection),
	roles: many(RoleToUser),
}))

export const noteImageRelations = relations(NoteImage, ({ one }) => ({
	note: one(Note, {
		fields: [NoteImage.noteId],
		references: [Note.id],
	}),
}))

export const userImageRelations = relations(UserImage, ({ one }) => ({
	user: one(User, {
		fields: [UserImage.userId],
		references: [User.id],
	}),
}))

export const passwordRelations = relations(Password, ({ one }) => ({
	user: one(User, {
		fields: [Password.userId],
		references: [User.id],
	}),
}))

export const sessionRelations = relations(Session, ({ one }) => ({
	user: one(User, {
		fields: [Session.userId],
		references: [User.id],
	}),
}))

export const connectionRelations = relations(Connection, ({ one }) => ({
	user: one(User, {
		fields: [Connection.userId],
		references: [User.id],
	}),
}))

export const permissionToRoleRelations = relations(
	PermissionToRole,
	({ one }) => ({
		role: one(Role, {
			fields: [PermissionToRole.roleId],
			references: [Role.id],
		}),
		permission: one(Permission, {
			fields: [PermissionToRole.permissionId],
			references: [Permission.id],
		}),
	}),
)

export const roleRelations = relations(Role, ({ many }) => ({
	permissionToRoles: many(PermissionToRole),
	roleToUsers: many(RoleToUser),
}))

export const permissionRelations = relations(Permission, ({ many }) => ({
	permissionToRoles: many(PermissionToRole),
}))

export const roleToUserRelations = relations(RoleToUser, ({ one }) => ({
	user: one(User, {
		fields: [RoleToUser.userId],
		references: [User.id],
	}),
	role: one(Role, {
		fields: [RoleToUser.roleId],
		references: [Role.id],
	}),
}))
