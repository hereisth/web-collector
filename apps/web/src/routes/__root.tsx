import { createRootRouteWithContext, Outlet } from '@tanstack/react-router'
import { lazy, Suspense } from 'react'

// Lazy load devtools for better performance
const TanStackRouterDevtools =
  process.env.NODE_ENV === 'production'
    ? () => null
    : lazy(() =>
        import('@tanstack/router-devtools').then((res) => ({
          default: res.TanStackRouterDevtools,
        }))
      )

export const Route = createRootRouteWithContext()({
  component: () => (
    <>
      <Outlet />
      <Suspense fallback={null}>
        <TanStackRouterDevtools position="bottom-right" />
      </Suspense>
    </>
  ),
})
