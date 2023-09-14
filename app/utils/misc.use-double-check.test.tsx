/**
 * @vitest-environment jsdom
 */
import { render, screen } from '@testing-library/react'
import { userEvent } from '@testing-library/user-event'
import { useState } from 'react'
import { expect, test } from 'vitest'
import { useDoubleCheck } from './misc.tsx'

function TestComponent() {
	const [defaultPrevented, setDefaultPrevented] = useState<
		'idle' | 'no' | 'yes'
	>('idle')
	const dc = useDoubleCheck()
	return (
		<div>
			<output>Default Prevented: {defaultPrevented}</output>
			<button
				{...dc.getButtonProps({
					onClick: e => setDefaultPrevented(e.defaultPrevented ? 'yes' : 'no'),
				})}
			>
				{dc.doubleCheck ? 'You sure?' : 'Click me'}
			</button>
		</div>
	)
}

test('prevents default on the first click, and does not on the second', async () => {
	const user = userEvent.setup()
	render(<TestComponent />)

	const status = screen.getByRole('status')
	const button = screen.getByRole('button')

	expect(status).toHaveTextContent('Default Prevented: idle')
	expect(button).toHaveTextContent('Click me')

	await user.click(button)
	expect(button).toHaveTextContent('You sure?')
	expect(status).toHaveTextContent('Default Prevented: yes')

	await user.click(button)
	expect(button).toHaveTextContent('You sure?')
	expect(status).toHaveTextContent('Default Prevented: no')
})

test('blurring the button starts things over', async () => {
	const user = userEvent.setup()
	render(<TestComponent />)

	const status = screen.getByRole('status')
	const button = screen.getByRole('button')

	await user.click(button)
	expect(button).toHaveTextContent('You sure?')
	expect(status).toHaveTextContent('Default Prevented: yes')

	await user.click(document.body)
	// button goes back to click me
	expect(button).toHaveTextContent('Click me')
	// our callback wasn't called, so the status doesn't change
	expect(status).toHaveTextContent('Default Prevented: yes')
})

test('hitting "escape" on the input starts things over', async () => {
	const user = userEvent.setup()
	render(<TestComponent />)

	const status = screen.getByRole('status')
	const button = screen.getByRole('button')

	await user.click(button)
	expect(button).toHaveTextContent('You sure?')
	expect(status).toHaveTextContent('Default Prevented: yes')

	await user.keyboard('{Escape}')
	// button goes back to click me
	expect(button).toHaveTextContent('Click me')
	// our callback wasn't called, so the status doesn't change
	expect(status).toHaveTextContent('Default Prevented: yes')
})
