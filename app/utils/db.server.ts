import { PrismaClient } from '@prisma/client'

let prisma: PrismaClient

declare global {
	var __prisma__: PrismaClient
}

// this is needed because in development we don't want to restart
// the server with every change, but we want to make sure we don't
// create a new connection to the DB with every change either.
// in production we'll have a single connection to the DB.
if (process.env.NODE_ENV === 'production') {
	prisma = new PrismaClient()
} else {
	if (!global.__prisma__) {
		global.__prisma__ = new PrismaClient()
	}
	prisma = global.__prisma__
	prisma.$connect()
}

export function interpolateArray(array: Array<string>, key: string) {
	const query = array.map((e, i) => `@${key}${i}`).join(',')
	const interpolations: Record<string, string> = {}
	for (let index = 0; index < array.length; index++) {
		interpolations[`${key}${index}`] = array[index]
	}
	return { query, interpolations }
}

export { prisma }
