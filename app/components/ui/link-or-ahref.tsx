import { Link } from '@remix-run/react'
import { Fragment } from 'react'
import type { ReactNode } from 'react'

interface Props {
  to: string;
  children: ReactNode;
  className: string;
  target?: undefined | "_blank";
  role?: string;
  rel?: string;
  reloadDocument?: boolean;
}

export function LinkOrAhref({ to, target, children, className, role, rel, reloadDocument }: Props) {
  return (
    <Fragment>
      {to.startsWith("http") ? (
        <a href={to} target={target} className={className} role={role} rel={rel}>
          {children}
        </a>
      ) : (
        <Link reloadDocument={reloadDocument} to={to} target={target} className={className} role={role}>
          {children}
        </Link>
      )}
    </Fragment>
  );
}
