import { useRef, useState } from 'react'
import { AlertCircle, CheckCircle2, Loader2 } from 'lucide-react'
import useCourses from '../hooks/useCourses'
import { submitEnquiry } from '../services/enquiryService'
import { getErrorInfo } from '../services/api'
import { normalizePhone, validateEnquiry } from '../utils/validators'

const INITIAL = { name: '', phone: '', secondaryPhone: '', course: '', email: '', notes: '' }

function Field({ label, required, error, htmlFor, children }) {
  return (
    <div>
      <label htmlFor={htmlFor} className="mb-1.5 block text-sm font-medium text-slate-700">
        {label} {required ? <span className="text-red-500">*</span> : <span className="text-xs text-slate-400">(optional)</span>}
      </label>
      {children}
      {error && <p className="mt-1 text-xs text-red-600">{error}</p>}
    </div>
  )
}

export default function EnquiryForm() {
  const { courses, loading: coursesLoading, error: coursesError, reload: reloadCourses } = useCourses()
  const [values, setValues] = useState(INITIAL)
  const [errors, setErrors] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const [serverError, setServerError] = useState('')
  const lock = useRef(false) // guards against double submits before state updates

  const handleChange = (e) => {
    const { name, value } = e.target
    setValues((v) => ({ ...v, [name]: value }))
    setErrors((er) => ({ ...er, [name]: '' }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (lock.current) return
    setServerError('')
    const errs = validateEnquiry(values)
    setErrors(errs)
    if (Object.keys(errs).length) return

    lock.current = true
    setSubmitting(true)
    try {
      await submitEnquiry({
        name: values.name.trim(),
        phone: normalizePhone(values.phone),
        secondaryPhone: normalizePhone(values.secondaryPhone),
        course: values.course,
        email: values.email.trim(),
        notes: values.notes.trim(),
      })
      setSuccess(true)
      setValues(INITIAL)
    } catch (err) {
      const info = getErrorInfo(err)
      setErrors(info.errors)
      setServerError(info.message)
    } finally {
      lock.current = false
      setSubmitting(false)
    }
  }

  const cls = (name) =>
    `w-full rounded-lg border bg-white px-3 py-2.5 text-sm outline-none transition focus:ring-2 focus:ring-brand-500/40 ${
      errors[name] ? 'border-red-400' : 'border-slate-300 focus:border-brand-500'
    }`

  if (success) {
    return (
      <div className="rounded-2xl bg-white p-8 text-center shadow-lg">
        <CheckCircle2 className="mx-auto h-12 w-12 text-green-500" />
        <h2 className="mt-3 text-xl font-bold text-slate-900">Thank you for your enquiry!</h2>
        <p className="mt-1 text-sm text-slate-500">Our team will contact you shortly.</p>
        <button
          onClick={() => setSuccess(false)}
          className="mt-6 rounded-lg border border-brand-600 px-4 py-2 text-sm font-medium text-brand-600 hover:bg-brand-50"
        >
          Submit another enquiry
        </button>
      </div>
    )
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="space-y-5 rounded-2xl bg-white p-6 shadow-lg sm:p-8">
      {serverError && (
        <div role="alert" className="flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{serverError}</span>
        </div>
      )}

      <Field label="Name" required error={errors.name} htmlFor="name">
        <input id="name" name="name" value={values.name} onChange={handleChange} autoComplete="name" className={cls('name')} />
      </Field>

      <div className="grid gap-5 sm:grid-cols-2">
        <Field label="Phone Number" required error={errors.phone} htmlFor="phone">
          <input id="phone" name="phone" type="tel" inputMode="tel" value={values.phone} onChange={handleChange} autoComplete="tel" placeholder="98765 43210" className={cls('phone')} />
        </Field>
        <Field label="Secondary Phone Number" required error={errors.secondaryPhone} htmlFor="secondaryPhone">
          <input id="secondaryPhone" name="secondaryPhone" type="tel" inputMode="tel" value={values.secondaryPhone} onChange={handleChange} placeholder="98765 43210" className={cls('secondaryPhone')} />
        </Field>
      </div>

      <Field
        label="Course"
        required
        error={errors.course || coursesError || (!coursesLoading && !courses.length ? 'No courses are available right now. Please check back later.' : '')}
        htmlFor="course"
      >
        <select id="course" name="course" value={values.course} onChange={handleChange} disabled={coursesLoading || !courses.length} className={cls('course')}>
          <option value="">{coursesLoading ? 'Loading courses…' : courses.length ? 'Select a course' : 'No courses available'}</option>
          {courses.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
        {coursesError && (
          <button type="button" onClick={() => reloadCourses()} className="mt-1 text-xs font-medium text-brand-600 hover:underline">
            Retry
          </button>
        )}
      </Field>

      <Field label="Email" error={errors.email} htmlFor="email">
        <input id="email" name="email" type="email" value={values.email} onChange={handleChange} autoComplete="email" className={cls('email')} />
      </Field>

      <Field label="Notes" error={errors.notes} htmlFor="notes">
        <textarea id="notes" name="notes" rows={4} value={values.notes} onChange={handleChange} className={cls('notes')} />
      </Field>

      <button
        type="submit"
        disabled={submitting}
        className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 py-3 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-70"
      >
        {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
        {submitting ? 'Submitting…' : 'Submit Enquiry'}
      </button>
    </form>
  )
}

