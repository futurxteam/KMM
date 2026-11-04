import { useState } from 'react'
import { BookOpen, Loader2, Pencil, Plus, Power, Trash2 } from 'lucide-react'
import { Card, EmptyState, ErrorState, Spinner } from '../../components/ui/Common'
import { ActiveBadge } from '../../components/ui/Badges'
import Modal, { ConfirmDialog } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import useAsync from '../../hooks/useAsync'
import { createCourse, deleteCourse, listCoursesAdmin, updateCourse } from '../../services/adminService'
import { getErrorInfo } from '../../services/api'
import { fmtDate } from '../../utils/format'

function CourseForm({ open, course, onClose, onSaved }) {
  const toast = useToast()
  const editing = Boolean(course)
  const [values, setValues] = useState({ name: '', description: '', isActive: true })
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [seenKey, setSeenKey] = useState(null)

  const key = open ? (course?.id || 'new') : null
  if (key !== seenKey) {
    setSeenKey(key)
    if (open) {
      setValues(course ? { name: course.name, description: course.description, isActive: course.isActive } : { name: '', description: '', isActive: true })
      setErrors({})
    }
  }

  const set = (e) => {
    const { name, value, type, checked } = e.target
    setValues((v) => ({ ...v, [name]: type === 'checkbox' ? checked : value }))
    setErrors((er) => ({ ...er, [name]: '' }))
  }

  const submit = async (e) => {
    e.preventDefault()
    if (saving) return
    if (!values.name.trim()) return setErrors({ name: 'Course name is required' })
    setSaving(true)
    try {
      const body = { name: values.name.trim(), description: values.description.trim() }
      if (editing) {
        await updateCourse(course.id, { ...body, isActive: values.isActive })
        toast.success('Course updated')
      } else {
        await createCourse(body)
        toast.success('Course created')
      }
      onSaved()
      onClose()
    } catch (err) {
      const info = getErrorInfo(err)
      setErrors(info.errors)
      if (!Object.keys(info.errors).length) toast.error(info.message)
    } finally {
      setSaving(false)
    }
    return undefined
  }

  return (
    <Modal
      open={open}
      title={editing ? 'Edit course' : 'Create course'}
      onClose={saving ? () => {} : onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="course-form" className="btn-primary" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} {editing ? 'Save changes' : 'Save course'}
          </button>
        </>
      }
    >
      <form id="course-form" onSubmit={submit} noValidate className="space-y-4">
        <div>
          <label htmlFor="c-name" className="mb-1 block text-sm font-medium text-slate-700">Course name</label>
          <input id="c-name" name="name" value={values.name} onChange={set} maxLength={120} className="field" />
          {errors.name && <p className="mt-1 text-xs text-red-600">{errors.name}</p>}
        </div>
        <div>
          <label htmlFor="c-desc" className="mb-1 block text-sm font-medium text-slate-700">Description <span className="text-xs font-normal text-slate-400">(optional)</span></label>
          <textarea id="c-desc" name="description" rows={3} maxLength={500} value={values.description} onChange={set} className="field" />
          {errors.description && <p className="mt-1 text-xs text-red-600">{errors.description}</p>}
        </div>
        {editing && (
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="isActive" checked={values.isActive} onChange={set} /> Active (shown in the public enquiry form)
          </label>
        )}
      </form>
    </Modal>
  )
}

export default function CoursesPage() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(() => listCoursesAdmin(), [])
  const [formFor, setFormFor] = useState(undefined)
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const courses = data?.courses || []

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await deleteCourse(toDelete.id)
      toast.success('Course deleted')
      setToDelete(null)
      reload()
    } catch (err) {
      toast.error(getErrorInfo(err).message)
    } finally {
      setDeleting(false)
    }
  }

  const toggle = async (c) => {
    try {
      await updateCourse(c.id, { isActive: !c.isActive })
      toast.success(c.isActive ? 'Course deactivated' : 'Course activated')
      reload()
    } catch (err) {
      toast.error(getErrorInfo(err).message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">Course Management</h2>
          <p className="text-sm text-slate-500">Active courses appear instantly in the public enquiry form.</p>
        </div>
        <button className="btn-primary w-full sm:w-auto" onClick={() => setFormFor(null)}>
          <Plus className="h-4 w-4" /> Create course
        </button>
      </div>

      {loading && !data ? (
        <Card><Spinner /></Card>
      ) : error ? (
        <Card><ErrorState message={error} onRetry={reload} /></Card>
      ) : !courses.length ? (
        <Card>
          <EmptyState
            icon={BookOpen}
            title="No courses yet"
            message="Add a course so students can pick it on the enquiry form."
            action={<button className="btn-primary" onClick={() => setFormFor(null)}><Plus className="h-4 w-4" /> Create course</button>}
          />
        </Card>
      ) : (
        <>
          {/* Mobile Card Layout (< 768px) */}
          <div className="space-y-3 md:hidden">
            {courses.map((c) => (
              <div key={c.id} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <h3 className="min-w-0 break-words text-base font-bold text-slate-900">{c.name}</h3>
                  <ActiveBadge active={c.isActive} />
                </div>

                <p className="mt-2 break-words text-xs text-slate-600">
                  {c.description || <span className="italic text-slate-400">No description provided</span>}
                </p>

                <p className="mt-2.5 text-[11px] text-slate-400">
                  Created: <span className="font-medium text-slate-600">{fmtDate(c.createdAt)}</span>
                </p>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setFormFor(c)}
                    className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggle(c)}
                    className={`inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                      c.isActive
                        ? 'border-amber-200 bg-amber-50/70 text-amber-800 hover:bg-amber-100'
                        : 'border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    <Power className="h-3.5 w-3.5" /> {c.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(c)}
                    aria-label={`Delete ${c.name}`}
                    className="inline-flex min-h-[40px] items-center justify-center gap-1.5 rounded-lg border border-red-200 bg-red-50/60 px-3 py-2 text-xs font-semibold text-red-600 hover:bg-red-100"
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Delete
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Tablet / Desktop Table (>= 768px) */}
          <Card padded={false} className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full min-w-[680px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="th">Course name</th>
                    <th className="th">Description</th>
                    <th className="th">Status</th>
                    <th className="th">Created</th>
                    <th className="th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {courses.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50/60">
                      <td className="td font-medium text-slate-900">{c.name}</td>
                      <td className="td max-w-xs truncate" title={c.description}>{c.description || '—'}</td>
                      <td className="td">
                        <button type="button" onClick={() => toggle(c)} title="Click to toggle">
                          <ActiveBadge active={c.isActive} />
                        </button>
                      </td>
                      <td className="td whitespace-nowrap">{fmtDate(c.createdAt)}</td>
                      <td className="td">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setFormFor(c)}
                            aria-label={`Edit ${c.name}`}
                            className="rounded p-2 text-slate-500 hover:bg-slate-100"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggle(c)}
                            aria-label={c.isActive ? `Deactivate ${c.name}` : `Activate ${c.name}`}
                            title={c.isActive ? 'Deactivate' : 'Activate'}
                            className="rounded p-2 text-slate-500 hover:bg-slate-100"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setToDelete(c)}
                            aria-label={`Delete ${c.name}`}
                            className="rounded p-2 text-red-500 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}

      <CourseForm open={formFor !== undefined} course={formFor || null} onClose={() => setFormFor(undefined)} onSaved={reload} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete course"
        message={toDelete ? `Delete "${toDelete.name}"? It will disappear from the enquiry form. Existing enquiries keep their course name.` : ''}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
