import { prisma } from '#app/utils/db.server.ts'

type Entity = 'user' | 'note' | 'school'
type Access = 'own' | 'any'

type Action = 'create' | 'read' | 'update' | 'delete'

type crudActions = {
	create: boolean
	read: boolean
	update: boolean
	delete: boolean
}

export async function createPermissions(
	entity: Entity,
	access: Access,
	crudActions: 'all' | 'readOnly' | crudActions,
) {
	try {
		if (crudActions === 'all') {
			crudActions = {
				create: true,
				read: true,
				update: true,
				delete: true,
			}
		} else if (crudActions === 'readOnly') {
			crudActions = {
				create: false,
				read: true,
				update: false,
				delete: false,
			}
		}
		for (const action of Object.keys(crudActions) as Action[]) {
			if (crudActions[action]) {
				await prisma.permission.create({
					data: {
						entity,
						action,
						access,
					},
				})
			}
		}
	} catch (error) {
		// Handle errors here
		console.error('Error creating permissions:', error)
		throw error
	}
}
