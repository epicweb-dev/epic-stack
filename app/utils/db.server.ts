import { PrismaClient } from '@prisma/client'
import { singleton } from './singleton.server.ts'

const prisma = singleton('prisma', () => new PrismaClient())
prisma.$connect()

export { prisma }
