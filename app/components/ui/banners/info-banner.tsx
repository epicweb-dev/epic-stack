interface Props {
  title: string;
  text: string;
}

export function InfoBanner({ title = "Note", text = "" }: Props) {
  return (
    <div className="bg-blue-50 mb-2 rounded-sm border border-blue-300">
      <div className="rounded-sm bg-blue-50 p-4">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path
                fillRule="evenodd"
                d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z"
                clipRule="evenodd"
              />
            </svg>
          </div>

          <div className="ml-3">
            <h3 className="text-sm leading-5 font-medium text-blue-800">{title}</h3>
            <div className="mt-2 text-sm leading-5 text-blue-700">
              <p>{text}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
