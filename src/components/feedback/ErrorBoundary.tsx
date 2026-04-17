import { Component, type ErrorInfo, type ReactNode } from 'react'

import { ErrorState } from './ErrorState'

export interface ErrorBoundaryProps {
  readonly children: ReactNode
  readonly fallback?: (error: Error, reset: () => void) => ReactNode
  readonly onError?: (error: Error, info: ErrorInfo) => void
}

interface State {
  readonly error: Error | null
}

/**
 * Class-component boundary so React can catch render-phase errors below it.
 * Falls back to ErrorState by default; caller can supply a custom fallback
 * render function. `onError` is where the host app wires Sentry (phase-g).
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, State> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { error: null }
    this.reset = this.reset.bind(this)
  }

  static getDerivedStateFromError(error: Error): State {
    return { error }
  }

  override componentDidCatch(error: Error, info: ErrorInfo) {
    this.props.onError?.(error, info)
  }

  reset() {
    this.setState({ error: null })
  }

  override render() {
    const { error } = this.state
    if (!error) {
      return this.props.children
    }
    if (this.props.fallback) {
      return this.props.fallback(error, this.reset)
    }
    return <ErrorState onRetry={this.reset} />
  }
}
