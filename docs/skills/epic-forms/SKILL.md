---
name: epic-forms
description: Guide on forms with Conform and validation with Zod for Epic Stack
categories:
  - forms
  - conform
  - zod
  - validation
---

# Epic Stack: Forms

## When to use this skill

Use this skill when you need to:
- Create forms in an Epic Stack application
- Implement form validation with Zod
- Work with Conform for progressively enhanced forms
- Handle file uploads
- Implement honeypot fields for spam protection
- Handle form errors
- Work with complex forms (fieldsets, arrays)

## Patterns and conventions

### Validation Philosophy

Following Epic Web principles:

**Explicit is better than implicit** - Make validation rules clear and explicit using Zod schemas. Every validation rule should be visible in the schema, not hidden in business logic. Error messages should be specific and helpful, telling users exactly what went wrong and how to fix it.

**Design to fail fast and early** - Validate input as early as possible, ideally on the client side before submission, and always on the server side. Return clear, specific error messages immediately so users can fix issues without frustration.

**Example - Explicit validation:**
```typescript
// ✅ Good - Explicit validation with clear error messages
const SignupSchema = z.object({
	email: z
		.string({ required_error: 'Email is required' })
		.email({ message: 'Please enter a valid email address' })
		.min(3, { message: 'Email must be at least 3 characters' })
		.max(100, { message: 'Email must be less than 100 characters' })
		.transform((val) => val.toLowerCase().trim()),
	password: z
		.string({ required_error: 'Password is required' })
		.min(6, { message: 'Password must be at least 6 characters' })
		.max(72, { message: 'Password must be less than 72 characters' }),
})

// ❌ Avoid - Implicit validation
const SignupSchema = z.object({
	email: z.string().email(), // No clear error messages
	password: z.string().min(6), // Generic error
})
```

**Example - Fail fast validation:**
```typescript
// ✅ Good - Validate early and return specific errors immediately
export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()

	// Validate immediately - fail fast
	const submission = await parseWithZod(formData, {
		schema: SignupSchema,
	})

	// Return errors immediately if validation fails
	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: 400 }, // Clear error status
		)
	}

	// Only proceed if validation passed
	const { email, password } = submission.value
	// ... continue with signup
}

// ❌ Avoid - Delayed or unclear validation
export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()
	const email = formData.get('email')
	const password = formData.get('password')

	// Validation scattered throughout the function
	if (!email) {
		// Generic error, not specific
		return json({ error: 'Invalid' }, { status: 400 })
	}
	// ... more scattered validation
}
```

### Basic setup with Conform

Epic Stack uses [Conform](https://conform.guide/) to handle forms with progressive enhancement.

**Basic setup:**
```typescript
import { getFormProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { z } from 'zod'
import { Form } from 'react-router'

const SignupSchema = z.object({
	email: z.string().email(),
	password: z.string().min(6),
})

export default function SignupRoute({ actionData }: Route.ComponentProps) {
	const [form, fields] = useForm({
		id: 'signup-form',
		constraint: getZodConstraint(SignupSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: SignupSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<Form method="POST" {...getFormProps(form)}>
			{/* Form fields */}
		</Form>
	)
}
```

### Integration with Zod

Conform integrates seamlessly with Zod for validation.

**Define schema:**
```typescript
import { z } from 'zod'

const SignupSchema = z.object({
	email: z.string().email('Invalid email'),
	password: z.string().min(6, 'Password must be at least 6 characters'),
	confirmPassword: z.string(),
}).superRefine(({ confirmPassword, password }, ctx) => {
	if (confirmPassword !== password) {
		ctx.addIssue({
			path: ['confirmPassword'],
			code: 'custom',
			message: 'Passwords must match',
		})
	}
})
```

**Validation in action (fail fast):**
```typescript
export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()

	// Validate immediately - explicit and fail fast
	const submission = await parseWithZod(formData, {
		schema: SignupSchema,
	})

	// Return explicit errors immediately if validation fails
	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	// Only proceed if validation passed - submission.value is type-safe
	const { email, password } = submission.value
	// ... process with validated data
}
```

### Async validation

For validations that require querying the database:

```typescript
export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()

	const submission = await parseWithZod(formData, {
		schema: SignupSchema.superRefine(async (data, ctx) => {
			const existingUser = await prisma.user.findUnique({
				where: { email: data.email },
				select: { id: true },
			})
			if (existingUser) {
				ctx.addIssue({
					path: ['email'],
					code: z.ZodIssueCode.custom,
					message: 'A user already exists with this email',
				})
			}
		}),
		async: true, // Important: enable async validation
	})

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	// ...
}
```

### Field Components

Epic Stack provides pre-built field components:

**Basic Field:**
```typescript
import { Field, ErrorList } from '#app/components/forms.tsx'
import { getInputProps } from '@conform-to/react'

<Field
	labelProps={{
		htmlFor: fields.email.id,
		children: 'Email',
	}}
	inputProps={{
		...getInputProps(fields.email, { type: 'email' }),
		autoFocus: true,
		autoComplete: 'email',
	}}
	errors={fields.email.errors}
/>
```

**TextareaField:**
```typescript
import { TextareaField } from '#app/components/forms.tsx'
import { getTextareaProps } from '@conform-to/react'

<TextareaField
	labelProps={{
		htmlFor: fields.content.id,
		children: 'Content',
	}}
	textareaProps={{
		...getTextareaProps(fields.content),
		rows: 10,
	}}
	errors={fields.content.errors}
/>
```

**CheckboxField:**
```typescript
import { CheckboxField } from '#app/components/forms.tsx'
import { getInputProps } from '@conform-to/react'

<CheckboxField
	labelProps={{
		htmlFor: fields.remember.id,
		children: 'Remember me',
	}}
	buttonProps={getInputProps(fields.remember, { type: 'checkbox' })}
	errors={fields.remember.errors}
/>
```

**OTPField:**
```typescript
import { OTPField } from '#app/components/forms.tsx'

<OTPField
	labelProps={{
		htmlFor: fields.code.id,
		children: 'Verification Code',
	}}
	inputProps={{
		...getInputProps(fields.code),
		maxLength: 6,
	}}
	errors={fields.code.errors}
/>
```

### Error Handling

**Display field errors:**
```typescript
<Field
	// ... props
	errors={fields.email.errors} // Errores específicos del campo
/>
```

**Display form errors:**
```typescript
import { ErrorList } from '#app/components/forms.tsx'

<ErrorList errors={form.errors} id={form.errorId} />
```

**Error structure:**
- `fields.fieldName.errors` - Errors for a specific field
- `form.errors` - General form errors (like `formErrors`)

### Honeypot Fields

Epic Stack includes spam protection with honeypot fields.

**In the form:**
```typescript
import { HoneypotInputs } from 'remix-utils/honeypot/react'

<Form method="POST" {...getFormProps(form)}>
	<HoneypotInputs /> {/* Always include in public forms */}
	{/* Rest of fields */}
</Form>
```

**In the action:**
```typescript
import { checkHoneypot } from '#app/utils/honeypot.server.ts'

export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()

	await checkHoneypot(formData) // Throws error if spam

	// ... rest of code
}
```

### File Uploads

For forms with file uploads, use `encType="multipart/form-data"`.

**Schema for files:**
```typescript
const MAX_UPLOAD_SIZE = 1024 * 1024 * 3 // 3MB

const ImageFieldsetSchema = z.object({
	id: z.string().optional(),
	file: z
		.instanceof(File)
		.optional()
		.refine((file) => {
			return !file || file.size <= MAX_UPLOAD_SIZE
		}, 'File must be less than 3MB'),
	altText: z.string().optional(),
})

const NoteEditorSchema = z.object({
	title: z.string().min(1).max(100),
	content: z.string().min(1).max(10000),
	images: z.array(ImageFieldsetSchema).max(5).optional(),
})
```

**Form with file upload:**
```typescript
<Form
	method="POST"
	encType="multipart/form-data"
	{...getFormProps(form)}
>
	{/* Fields */}
</Form>
```

**Process files in action:**
```typescript
export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()

	const submission = await parseWithZod(formData, {
		schema: NoteEditorSchema,
	})

	if (submission.status !== 'success') {
		return data({ result: submission.reply() }, { status: 400 })
	}

	const { images } = submission.value

	// Process files
	for (const image of images ?? []) {
		if (image.file) {
			// Upload file, save to storage, etc.
		}
	}

	// ...
}
```

### Fieldsets y Arrays

For forms with repetitive fields (like multiple images):

**Schema:**
```typescript
const ImageFieldsetSchema = z.object({
	id: z.string().optional(),
	file: z.instanceof(File).optional(),
	altText: z.string().optional(),
})

const FormSchema = z.object({
	images: z.array(ImageFieldsetSchema).max(5).optional(),
})
```

**In the component:**
```typescript
import { FormProvider, getFieldsetProps } from '@conform-to/react'

const [form, fields] = useForm({
	// ...
	defaultValue: {
		images: note?.images ?? [{}],
	},
})

const imageList = fields.images.getFieldList()

return (
	<FormProvider context={form.context}>
		<Form method="POST" {...getFormProps(form)}>
			{imageList.map((image, index) => {
				const imageFieldset = getFieldsetProps(fields.images[index])
				return (
					<fieldset key={image.key} {...imageFieldset}>
						<input
							{...getInputProps(fields.images[index].file, { type: 'file' })}
						/>
						<input
							{...getInputProps(fields.images[index].altText, { type: 'text' })}
							placeholder="Alt text"
						/>
					</fieldset>
				)
			})}

			<button
				type="button"
				onClick={() => fields.images.append()}
			>
				Add Image
			</button>
		</Form>
	</FormProvider>
)
```

### StatusButton

Use `StatusButton` to display submission status:

```typescript
import { StatusButton } from '#app/components/ui/status-button.tsx'
import { useIsPending } from '#app/utils/misc.tsx'

const isPending = useIsPending()

<StatusButton
	className="w-full"
	status={isPending ? 'pending' : (form.status ?? 'idle')}
	type="submit"
	disabled={isPending}
>
	Submit
</StatusButton>
```

### Progressive Enhancement

Forms work without JavaScript thanks to Conform:

- Native HTML5 validation
- Server-side validation
- Enhancements with JavaScript when available

**You don't need to do anything special** - Conform handles this automatically.

### Reusable Schema Validation

Create reusable schemas in `app/utils/user-validation.ts`:

```typescript
// app/utils/user-validation.ts
import { z } from 'zod'

export const EmailSchema = z
	.string({ required_error: 'Email is required' })
	.email({ message: 'Email is invalid' })
	.min(3, { message: 'Email is too short' })
	.max(100, { message: 'Email is too long' })
	.transform((value) => value.toLowerCase())

export const PasswordSchema = z
	.string({ required_error: 'Password is required' })
	.min(6, { message: 'Password is too short' })
	.refine((val) => new TextEncoder().encode(val).length <= 72, {
		message: 'Password is too long',
	})

export const PasswordAndConfirmPasswordSchema = z
	.object({ password: PasswordSchema, confirmPassword: PasswordSchema })
	.superRefine(({ confirmPassword, password }, ctx) => {
		if (confirmPassword !== password) {
			ctx.addIssue({
				path: ['confirmPassword'],
				code: 'custom',
				message: 'The passwords must match',
			})
		}
	})
```

**Use in forms:**
```typescript
import { EmailSchema, PasswordAndConfirmPasswordSchema } from '#app/utils/user-validation.ts'

const SignupSchema = z
	.object({
		email: EmailSchema,
		username: UsernameSchema,
	})
	.and(PasswordAndConfirmPasswordSchema)
```

## Common examples

### Example 1: Simple login form

```typescript
// app/routes/_auth/login.tsx
import { getFormProps, getInputProps, useForm } from '@conform-to/react'
import { getZodConstraint, parseWithZod } from '@conform-to/zod'
import { z } from 'zod'
import { Field, ErrorList } from '#app/components/forms.tsx'
import { StatusButton } from '#app/components/ui/status-button.tsx'

const LoginSchema = z.object({
	email: z.string().email(),
	password: z.string().min(1),
})

export default function LoginRoute({ actionData }: Route.ComponentProps) {
	const isPending = useIsPending()

	const [form, fields] = useForm({
		id: 'login-form',
		constraint: getZodConstraint(LoginSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: LoginSchema })
		},
		shouldRevalidate: 'onBlur',
	})

	return (
		<Form method="POST" {...getFormProps(form)}>
			<Field
				labelProps={{ htmlFor: fields.email.id, children: 'Email' }}
				inputProps={{
					...getInputProps(fields.email, { type: 'email' }),
					autoFocus: true,
					autoComplete: 'email',
				}}
				errors={fields.email.errors}
			/>
			<Field
				labelProps={{ htmlFor: fields.password.id, children: 'Password' }}
				inputProps={{
					...getInputProps(fields.password, { type: 'password' }),
					autoComplete: 'current-password',
				}}
				errors={fields.password.errors}
			/>
			<ErrorList errors={form.errors} id={form.errorId} />
			<StatusButton
				status={isPending ? 'pending' : (form.status ?? 'idle')}
				type="submit"
			>
				Login
			</StatusButton>
		</Form>
	)
}
```

### Example 2: Form with async validation

```typescript
// app/routes/_auth/signup.tsx
export async function action({ request }: Route.ActionArgs) {
	const formData = await request.formData()
	await checkHoneypot(formData)

	const submission = await parseWithZod(formData, {
		schema: SignupSchema.superRefine(async (data, ctx) => {
			const existingUser = await prisma.user.findUnique({
				where: { email: data.email },
				select: { id: true },
			})
			if (existingUser) {
				ctx.addIssue({
					path: ['email'],
					code: z.ZodIssueCode.custom,
					message: 'A user already exists with this email',
				})
			}
		}),
		async: true,
	})

	if (submission.status !== 'success') {
		return data(
			{ result: submission.reply() },
			{ status: submission.status === 'error' ? 400 : 200 },
		)
	}

	// Procesar signup...
}
```

### Example 3: Form with file upload

```typescript
// app/routes/users/$username/notes/new.tsx
const NoteEditorSchema = z.object({
	title: z.string().min(1).max(100),
	content: z.string().min(1).max(10000),
	images: z.array(ImageFieldsetSchema).max(5).optional(),
})

export default function NewNoteRoute({ actionData }: Route.ComponentProps) {
	const [form, fields] = useForm({
		id: 'note-editor',
		constraint: getZodConstraint(NoteEditorSchema),
		lastResult: actionData?.result,
		onValidate({ formData }) {
			return parseWithZod(formData, { schema: NoteEditorSchema })
		},
		defaultValue: {
			images: [{}],
		},
		shouldRevalidate: 'onBlur',
	})

	const imageList = fields.images.getFieldList()

	return (
		<FormProvider context={form.context}>
			<Form
				method="POST"
				encType="multipart/form-data"
				{...getFormProps(form)}
			>
				<Field
					labelProps={{ children: 'Title' }}
					inputProps={{
						autoFocus: true,
						...getInputProps(fields.title, { type: 'text' }),
					}}
					errors={fields.title.errors}
				/>
				<TextareaField
					labelProps={{ children: 'Content' }}
					textareaProps={{
						...getTextareaProps(fields.content),
						rows: 10,
					}}
					errors={fields.content.errors}
				/>

				{imageList.map((image, index) => {
					const imageFieldset = getFieldsetProps(fields.images[index])
					return (
						<fieldset key={image.key} {...imageFieldset}>
							<input
								{...getInputProps(fields.images[index].file, { type: 'file' })}
								accept="image/*"
							/>
							<input
								{...getInputProps(fields.images[index].altText, { type: 'text' })}
								placeholder="Alt text"
							/>
						</fieldset>
					)
				})}

				<button
					type="button"
					onClick={() => fields.images.append()}
					disabled={imageList.length >= 5}
				>
					Add Image
				</button>

				<ErrorList errors={form.errors} id={form.errorId} />
				<StatusButton type="submit">Create Note</StatusButton>
			</Form>
		</FormProvider>
	)
}
```

## Common mistakes to avoid

- ❌ **Implicit validation**: Always use explicit Zod schemas with clear error messages, not hidden validation logic
- ❌ **Delayed validation**: Validate input immediately and fail fast - don't wait until the end of the function
- ❌ **Generic error messages**: Use specific, helpful error messages that tell users exactly what's wrong
- ❌ **Forgetting `async: true` in async validation**: Always include `async: true` when using `superRefine` with async
- ❌ **Not including `HoneypotInputs` in public forms**: Always include honeypot in forms accessible without authentication
- ❌ **Forgetting `encType="multipart/form-data"`**: Required for file uploads
- ❌ **Not validating file sizes**: Always validate size in the schema
- ❌ **Not using `getZodConstraint`**: Required for native HTML5 validation
- ❌ **Forgetting `lastResult` in `useForm`**: Required to display server errors
- ❌ **Not using `shouldRevalidate: 'onBlur'`**: Improves UX by validating on field blur
- ❌ **Not using pre-built field components**: `Field`, `TextareaField`, etc. already handle accessibility and errors

## References

- [Conform Documentation](https://conform.guide/)
- [Zod Documentation](https://zod.dev/)
- [Epic Web Principles](https://www.epicweb.dev/principles)
- `app/components/forms.tsx` - Field components
- `app/routes/_auth/signup.tsx` - Complete signup example
- `app/routes/_auth/onboarding/index.tsx` - Complex form example
- `app/routes/users/$username/notes/+shared/note-editor.tsx` - File uploads example
- `app/utils/user-validation.ts` - Reusable schemas
- `docs/decisions/033-honeypot.md` - Honeypot documentation
