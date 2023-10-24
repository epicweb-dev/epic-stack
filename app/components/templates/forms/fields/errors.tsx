import { cn } from '#app/utils/misc.tsx'

export type ListOfErrors = (string | null | undefined)[] | null | undefined

export function ErrorList({
	id,
	errors,
}: {
	errors?: ListOfErrors
	id?: string
}) {
	const errorsToRender = errors?.filter(Boolean)
	if (!errorsToRender?.length) return null
	return (
		<ul id={id} className="flex flex-col gap-1">
			{errorsToRender.map(e => (
				<li key={e} className="text-sm font-medium text-destructive">
					{e}
				</li>
			))}
		</ul>
	)
}

export function Errors({
	errorId,
	errors,
	className,
}: {
	errorId?: string
	errors?: ListOfErrors
	className?: string
}) {
	return (
		<div className={cn('min-h-[32px] px-4 pb-3 pt-1', className)}>
			{errorId ? <ErrorList id={errorId} errors={errors} /> : null}
		</div>
	)
}
