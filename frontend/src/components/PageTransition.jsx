import { useLocation } from 'react-router-dom'

/**
 * PageTransition
 *
 * Wraps its children in a div keyed to the current route pathname.
 * Every time the pathname changes React unmounts the old keyed div and
 * mounts a fresh one, which re-triggers the CSS @keyframes animation
 * defined in index.css (.page-enter).
 *
 * UI method: CSS keyframe animation (fade + translate-Y) triggered by
 * React key remounting — zero JS animation libraries needed, hardware-
 * accelerated via `opacity` and `transform` only.
 */
function PageTransition({ children }) {
  const { pathname } = useLocation()

  return (
    <div key={pathname} className="page-enter">
      {children}
    </div>
  )
}

export default PageTransition
