import { useSyncExternalStore } from 'react'

/**
 * Returns `false` during SSR and the first client render, then `true` after mount.
 * Uses useSyncExternalStore (React 18+) to avoid setState-in-effect lint errors.
 */
const emptySubscribe = () => () => {}

export function useIsMounted(): boolean {
  return useSyncExternalStore(
    emptySubscribe,
    () => true,   // client: always mounted after hydration
    () => false   // server: not mounted
  )
}
