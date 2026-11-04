import { useState } from 'react'
import { Eye, EyeOff, Loader2, AlertCircle, Lock, User } from 'lucide-react'

export default function LoginForm({ identifierLabel, identifierPlaceholder, onSubmit, notice }) {
  const [values, setValues] = useState({ username: '', password: '' })
  const [errors, setErrors] = useState({})
  const [show, setShow] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [serverError, setServerError] = useState('')

  const handleChange = (e) => {
    setValues((v) => ({ ...v, [e.target.name]: e.target.value }))
    setErrors((er) => ({ ...er, [e.target.name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (submitting) return
    const errs = {}
    if (!values.username.trim()) errs.username = `${identifierLabel} is required`
    if (!values.password) errs.password = 'Password is required'
    setErrors(errs)
    if (Object.keys(errs).length) return

    setServerError('')
    setSubmitting(true)
    try {
      await onSubmit({ username: values.username.trim(), password: values.password })
    } catch (err) {
      setServerError(
        err.response ? err.response.data?.message || 'Login failed' : 'Unable to reach the server. Please try again.'
      )
      setSubmitting(false)
    }
  }

  const inputCls = (name) =>
    `w-full rounded-lg border bg-white py-2.5 pl-10 pr-3 text-sm outline-none transition focus:ring-2 focus:ring-brand-500/40 ${
      errors[name] ? 'border-red-400' : 'border-slate-300 focus:border-brand-500'
    }`

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5">
      {(notice || serverError) && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{serverError || notice}</span>
        </div>
      )}

      <div>
        <label htmlFor="username" className="mb-1.5 block text-sm font-medium text-slate-700">
          {identifierLabel}
        </label>
        <div className="relative">
          <User className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="username"
            name="username"
            autoComplete="username"
            value={values.username}
            onChange={handleChange}
            placeholder={identifierPlaceholder}
            className={inputCls('username')}
          />
        </div>
        {errors.username && <p className="mt-1 text-xs text-red-600">{errors.username}</p>}
      </div>

      <div>
        <label htmlFor="password" className="mb-1.5 block text-sm font-medium text-slate-700">
          Password
        </label>
        <div className="relative">
          <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
          <input
            id="password"
            name="password"
            type={show ? 'text' : 'password'}
            autoComplete="current-password"
            value={values.password}
            onChange={handleChange}
            placeholder="Enter your password"
            className={`${inputCls('password')} pr-10`}
          />
          <button
            type="button"
            onClick={() => setShow((s) => !s)}
            aria-label={show ? 'Hide password' : 'Show password'}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          >
            {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
        {errors.password && <p className="mt-1 text-xs text-red-600">{errors.password}</p>}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? 'Signing in…' : 'Sign in'}
      </button>
    </form>
  )
}

