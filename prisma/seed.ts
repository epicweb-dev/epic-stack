import { faker } from '@faker-js/faker'
import { createPassword, createUser, downloadFile } from './seed-utils'
import { prisma } from '~/utils/db.server'
import { deleteAllData } from '../other/test-setup/utils'
import { getPasswordHash } from '~/utils/auth.server'

async function seed() {
	console.log('🌱 Seeding...')
	console.time(`🌱 Database has been seeded`)

	console.time('🧹 Cleaned up the database...')
	await deleteAllData()
	console.timeEnd('🧹 Cleaned up the database...')

	// hosts with ships and reviews
	// renters with bookings and reviews
	// hosts who are renters also
	const totalUsers = 40
	console.time(`👤 Created ${totalUsers} users...`)
	const users = await Promise.all(
		Array.from({ length: totalUsers }, async () => {
			const gender = faker.helpers.arrayElement(['female', 'male']) as
				| 'female'
				| 'male'
			const userData = createUser({ gender })
			const imageGender = gender === 'female' ? 'women' : 'men'
			const imageNumber = faker.datatype.number({ min: 0, max: 99 })
			const user = await prisma.user.create({
				data: {
					...userData,
					password: {
						create: createPassword(userData.username),
					},
					image: {
						create: {
							contentType: 'image/jpeg',
							file: {
								create: {
									blob: await downloadFile(
										`https://randomuser.me/api/portraits/${imageGender}/${imageNumber}.jpg`,
									),
								},
							},
						},
					},
					notes: {
						create: Array.from({
							length: faker.datatype.number({ min: 0, max: 10 }),
						}).map(() => ({
							title: faker.lorem.sentence(),
							content: faker.lorem.paragraphs(),
						})),
					},
				},
			})
			return user
		}),
	)
	console.timeEnd(`👤 Created ${totalUsers} users...`)

	console.time(`🐨 Created user "kody" with the password "kodylovesyou"`)
	await prisma.user.create({
		data: {
			email: 'kody@kcd.dev',
			username: 'kody',
			name: 'Kody',
			image: {
				create: {
					contentType: 'image/png',
					file: {
						create: {
							blob: await downloadFile(
								`https://user-images.githubusercontent.com/1500684/236315453-aca298fe-20e1-46d7-9b41-f810b453b068.png`,
							),
						},
					},
				},
			},
			password: {
				create: {
					hash: await getPasswordHash('kodylovesyou'),
				},
			},
			notes: {
				create: [
					{
						title: 'Basic Koala Facts',
						content:
							'Koalas are found in the eucalyptus forests of eastern Australia. They have grey fur with a cream-coloured chest, and strong, clawed feet, perfect for living in the branches of trees!',
					},
					{
						title: 'Koalas like to cuddle',
						content:
							'Cuddly critters, koalas measure about 60cm to 85cm long, and weigh about 14kg.',
					},
					{
						title: 'Not bears',
						content:
							"Although you may have heard people call them koala 'bears', these awesome animals aren’t bears at all – they are in fact marsupials. A group of mammals, most marsupials have pouches where their newborns develop.",
					},
				],
			},
		},
	})
	console.timeEnd(`🐨 Created user "kody" with the password "kodylovesyou"`)

	console.timeEnd(`🌱 Database has been seeded`)
}

seed()
	.catch(e => {
		console.error(e)
		process.exit(1)
	})
	.finally(async () => {
		await prisma.$disconnect()
	})

/*
eslint
	@typescript-eslint/no-unused-vars: "off",
*/
