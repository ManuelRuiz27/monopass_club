import type { InputHTMLAttributes } from 'react'

type InputState = 'default' | 'error' | 'success'

export type InputProps = Omit<InputHTMLAttributes<HTMLInputElement>, 'size'> & {
  label?: string
  hint?: string
  error?: string
  state?: InputState
  loading?: boolean
}

function deriveState(state: InputState | undefined, error: string | undefined): InputState {
  if (error) return 'error'
  return state ?? 'default'
}

export function Input({ label, hint, error, state, loading = false, id, disabled, className, ...props }: InputProps) {
  const inputId = id ?? props.name
  const effectiveState = deriveState(state, error)
  const helper = error ?? hint
  const helperClassName = error ? 'ui-input-helper ui-input-helper--error' : 'ui-input-helper ui-input-helper--hint'

  return (
    <div className="ui-input-field" data-state={effectiveState}>
      {label ? (
        <label className="ui-input-label" htmlFor={inputId}>
          {label}
        </label>
      ) : null}
      <div className="ui-input-control-wrap">
        <input
          id={inputId}
          {...props}
          disabled={disabled || loading}
          className={className ? `ui-input-control ${className}` : 'ui-input-control'}
        />
        {loading ? <span className="ui-input-spinner" aria-hidden="true" /> : null}
      </div>
      <small className={helperClassName}>{helper ?? ' '}</small>
    </div>
  )
}
