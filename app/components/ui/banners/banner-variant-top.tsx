import clsx from 'clsx'
import { useState } from 'react'
import type { ReactNode } from 'react'
import { LinkOrAhref } from '../link-or-ahref.tsx'

export type BannerBlockDto = {
  text: string;
  href?: string;
  cta: {
    text: ReactNode;
    href: string;
    isPrimary?: boolean;
  }[];
};

export function BannerVariantTop({ item }: { item: BannerBlockDto }) {
  const [open, setOpen] = useState(true);

  return (
    <span>
      {item && open && (
        <div className="border-b-2 border-theme-500 bg-slate-900">
          <div className="mx-auto max-w-7xl py-1.5 px-3 sm:py-3 sm:px-6 lg:px-8">
            <div className="flex w-full items-center space-x-3 lg:w-auto lg:justify-end">
              <div className={clsx("flex flex-grow", item.cta ? "justify-start" : "justify-center")}>
                <div className="flex items-baseline space-x-1 text-sm font-medium text-white sm:text-base">
                  {item.href ? (
                    <LinkOrAhref to={item.href} className="hover:underline">
                      {item.text}
                    </LinkOrAhref>
                  ) : (
                    <span>{item.text}</span>
                  )}
                </div>
              </div>
              {item.cta && (
                <div className="order-2 mt-0 flex w-auto flex-shrink-0 space-x-2">
                  {item.cta.map((cta, idx) => {
                    return (
                      <LinkOrAhref
                        key={idx}
                        to={cta.href}
                        className={clsx(
                          "flex items-center justify-center space-x-1 rounded-md border border-transparent px-4 py-2 text-xs font-medium shadow-sm sm:text-sm",
                          cta.isPrimary ? "bg-theme-400 text-theme-900 hover:bg-theme-500" : "border-gray-700 text-gray-100 hover:bg-gray-800"
                        )}
                      >
                        <span>{cta.text}</span>
                      </LinkOrAhref>
                    );
                  })}
                </div>
              )}
              <div className="order-3 ml-2 hidden flex-shrink-0 sm:flex">
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="-mr-1 flex rounded-md p-2 hover:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-slate-400 sm:-mr-2"
                >
                  <span className="sr-only">Close</span>
                  <svg
                    className="h-6 w-6 text-slate-400"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </span>
  );
}
