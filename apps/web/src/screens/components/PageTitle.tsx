import { useEffect, useRef, type ReactNode } from "react"

type PageTitleProps = {
  children: ReactNode
}

/** Large page title; takes focus on mount so route changes land on the new screen for assistive tech. */
export function PageTitle({ children }: PageTitleProps) {
  const titleRef = useRef<HTMLHeadingElement | null>(null)

  useEffect(() => {
    titleRef.current?.focus({ preventScroll: true })
  }, [])

  return (
    <h1 className="page-title" ref={titleRef} tabIndex={-1}>
      {children}
    </h1>
  )
}
