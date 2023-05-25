import { z } from 'zod'

export const checkboxSchema = (msgWhenRequired?: string) => {
	const transformedValue = z
		.literal('on')
		.optional()
		.transform(value => value === 'on')
	return msgWhenRequired
		? transformedValue.refine(_ => _, { message: msgWhenRequired })
		: transformedValue
}
