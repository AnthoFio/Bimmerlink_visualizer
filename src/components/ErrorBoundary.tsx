import { Component } from 'react'
import type { ReactNode } from 'react'

interface Props {
  children: ReactNode
  /** Changing it clears the error, for example when another log is opened. */
  resetKey?: unknown
}

interface State {
  failed: boolean
  resetKey: unknown
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { failed: false, resetKey: this.props.resetKey }

  static getDerivedStateFromError(): Partial<State> {
    return { failed: true }
  }

  static getDerivedStateFromProps(props: Props, state: State): State | null {
    return props.resetKey === state.resetKey ? null : { failed: false, resetKey: props.resetKey }
  }

  render() {
    if (!this.state.failed) return this.props.children
    return (
      <p role="alert" className="message message-error">
        This log could not be displayed. Open another file, or reload the page.
      </p>
    )
  }
}
