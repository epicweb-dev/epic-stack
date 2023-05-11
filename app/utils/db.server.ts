import { PrismaClient } from '@prisma/client'
import { singleton } from './singleton.server'

const prisma = singleton('prisma', () => new PrismaClient())
prisma.$connect()

export { prisma }
