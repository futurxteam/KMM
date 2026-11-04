import { useState } from 'react'
import { Loader2, Pencil, Plus, Power, Trash2, Users } from 'lucide-react'
import { Card, EmptyState, ErrorState, Spinner } from '../../components/ui/Common'
import { ActiveBadge } from '../../components/ui/Badges'
import Modal, { ConfirmDialog } from '../../components/ui/Modal'
import { useToast } from '../../components/ui/Toast'
import useAsync from '../../hooks/useAsync'
import { createPA, deletePA, listPAs, updatePA } from '../../services/adminService'
import { getErrorInfo } from '../../services/api'
import { fmtDate, fmtDateTime } from '../../utils/format'

const FieldError = ({ msg }) => (msg ? <p className="mt-1 text-xs text-red-600">{msg}</p> : null)

const EMPTY = { name: '', username: '', password: '', confirmPassword: '', isActive: true }

function PAForm({ open, pa, onClose, onSaved }) {
  const toast = useToast()
  const editing = Boolean(pa)
  const [values, setValues] = useState(EMPTY)
  const [errors, setErrors] = useState({})
  const [saving, setSaving] = useState(false)
  const [show, setShow] = useState(false)
  const [seenKey, setSeenKey] = useState(null)

  // Reset the form each time the modal opens (adjust state during render, not in an effect).
  const key = open ? (pa?.id || 'new') : null
  if (key !== seenKey) {
    setSeenKey(key)
    if (open) {
      setValues(pa ? { ...EMPTY, name: pa.name, username: pa.username, isActive: pa.isActive } : EMPTY)
      setErrors({})
      setShow(false)
    }
  }

  const set = (e) => {
    const { name, value, type, checked } = e.target
    setValues((v) => ({ ...v, [name]: type === 'checkbox' ? checked : value }))
    setErrors((er) => ({ ...er, [name]: '' }))
  }

  const validate = () => {
    const er = {}
    if (!values.name.trim()) er.name = 'Name is required'
    if (!/^[A-Za-z0-9._-]{3,30}$/.test(values.username.trim())) er.username = 'Username must be 3-30 characters: letters, numbers, . _ -'
    const pwRequired = !editing || values.password
    if (pwRequired) {
      if (values.password.length < 8 || !/[A-Za-z]/.test(values.password) || !/\d/.test(values.password)) er.password = 'At least 8 characters with letters and numbers'
      if (values.confirmPassword !== values.password) er.confirmPassword = 'Passwords do not match'
    }
    return er
  }

  const submit = async (e) => {
    e.preventDefault()
    if (saving) return
    const er = validate()
    setErrors(er)
    if (Object.keys(er).length) return
    setSaving(true)
    try {
      const body = { name: values.name.trim(), username: values.username.trim(), isActive: values.isActive }
      if (editing) {
        if (values.password) body.password = values.password
        await updatePA(pa.id, body)
        toast.success('PA account updated')
      } else {
        await createPA({ ...body, password: values.password, confirmPassword: values.confirmPassword })
        toast.success('PA account created')
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
  }
  return (
    <Modal
      open={open}
      title={editing ? 'Edit PA' : 'Create PA'}
      onClose={saving ? () => {} : onClose}
      footer={
        <>
          <button type="button" className="btn-secondary" onClick={onClose} disabled={saving}>Cancel</button>
          <button type="submit" form="pa-form" className="btn-primary" disabled={saving}>
            {saving && <Loader2 className="h-4 w-4 animate-spin" />} {editing ? 'Save changes' : 'Create PA'}
          </button>
        </>
      }
    >
      <form id="pa-form" onSubmit={submit} noValidate className="space-y-4">
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="pa-name">Name</label>
          <input id="pa-name" name="name" value={values.name} onChange={set} className="field" />
          <FieldError msg={errors.name} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="pa-username">Username</label>
          <input id="pa-username" name="username" value={values.username} onChange={set} autoComplete="off" className="field" />
          <FieldError msg={errors.username} />
        </div>
        <div>
          <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="pa-password">
            {editing ? 'New password' : 'Password'} {editing && <span className="text-xs font-normal text-slate-400">(leave blank to keep current)</span>}
          </label>
          <input id="pa-password" name="password" type={show ? 'text' : 'password'} value={values.password} onChange={set} autoComplete="new-password" className="field" />
          <FieldError msg={errors.password} />
        </div>
        {(!editing || values.password) && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700" htmlFor="pa-confirm">Confirm password</label>
            <input id="pa-confirm" name="confirmPassword" type={show ? 'text' : 'password'} value={values.confirmPassword} onChange={set} autoComplete="new-password" className="field" />
            <FieldError msg={errors.confirmPassword} />
          </div>
        )}
        <label className="flex items-center gap-2 text-sm text-slate-600">
          <input type="checkbox" checked={show} onChange={(e) => setShow(e.target.checked)} /> Show password
        </label>
        {editing && (
          <label className="flex items-center gap-2 text-sm font-medium text-slate-700">
            <input type="checkbox" name="isActive" checked={values.isActive} onChange={set} /> Account active
          </label>
        )}
      </form>
    </Modal>
  )
}

export default function PAManagementPage() {
  const toast = useToast()
  const { data, loading, error, reload } = useAsync(() => listPAs(), [])
  const [formFor, setFormFor] = useState(undefined) // undefined = closed, null = create, object = edit
  const [toDelete, setToDelete] = useState(null)
  const [deleting, setDeleting] = useState(false)
  const pas = data?.pas || []

  const confirmDelete = async () => {
    setDeleting(true)
    try {
      await deletePA(toDelete.id)
      toast.success('PA account deleted')
      setToDelete(null)
      reload()
    } catch (err) {
      toast.error(getErrorInfo(err).message)
    } finally {
      setDeleting(false)
    }
  }

  const toggleActive = async (pa) => {
    try {
      await updatePA(pa.id, { isActive: !pa.isActive })
      toast.success(pa.isActive ? `${pa.name} deactivated` : `${pa.name} activated`)
      reload()
    } catch (err) {
      toast.error(getErrorInfo(err).message)
    }
  }

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h2 className="text-lg font-bold text-slate-900 sm:text-xl">PA Management</h2>
          <p className="text-sm text-slate-500">Create and manage Personal Assistant accounts.</p>
        </div>
        <button className="btn-primary w-full sm:w-auto" onClick={() => setFormFor(null)}>
          <Plus className="h-4 w-4" /> Create PA
        </button>
      </div>

      {loading && !data ? (
        <Card><Spinner /></Card>
      ) : error ? (
        <Card><ErrorState message={error} onRetry={reload} /></Card>
      ) : !pas.length ? (
        <Card>
          <EmptyState
            icon={Users}
            title="No PA accounts yet"
            message="Create the first PA so enquiries can be followed up."
            action={<button className="btn-primary" onClick={() => setFormFor(null)}><Plus className="h-4 w-4" /> Create PA</button>}
          />
        </Card>
      ) : (
        <>
          {/* Mobile Card Layout (< 768px) */}
          <div className="space-y-3 md:hidden">
            {pas.map((p) => (
              <div key={p.id} className="rounded-xl border border-slate-200/80 bg-white p-4 shadow-xs">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <h3 className="truncate text-base font-bold text-slate-900">{p.name}</h3>
                    <p className="truncate text-xs text-slate-500">@{p.username}</p>
                  </div>
                  <ActiveBadge active={p.isActive} />
                </div>

                <div className="mt-3 grid grid-cols-2 gap-2 rounded-lg bg-slate-50 p-2.5 text-xs">
                  <div>
                    <p className="text-[11px] font-medium text-slate-400">Enquiries Contacted</p>
                    <p className="mt-0.5 text-sm font-bold text-slate-900">{p.totalContacted}</p>
                  </div>
                  <div>
                    <p className="text-[11px] font-medium text-slate-400">Created Date</p>
                    <p className="mt-0.5 font-medium text-slate-700">{fmtDate(p.createdAt)}</p>
                  </div>
                  <div className="col-span-2 border-t border-slate-200/70 pt-2">
                    <p className="text-[11px] font-medium text-slate-400">Last Activity</p>
                    <p className="mt-0.5 font-medium text-slate-700">
                      {p.lastActivity ? fmtDateTime(p.lastActivity) : 'No activity yet'}
                    </p>
                  </div>
                </div>

                <div className="mt-3 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-3">
                  <button
                    type="button"
                    onClick={() => setFormFor(p)}
                    className="inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50"
                  >
                    <Pencil className="h-3.5 w-3.5" /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => toggleActive(p)}
                    className={`inline-flex min-h-[40px] flex-1 items-center justify-center gap-1.5 rounded-lg border px-3 py-2 text-xs font-semibold ${
                      p.isActive
                        ? 'border-amber-200 bg-amber-50/70 text-amber-800 hover:bg-amber-100'
                        : 'border-emerald-200 bg-emerald-50/70 text-emerald-800 hover:bg-emerald-100'
                    }`}
                  >
                    <Power className="h-3.5 w-3.5" /> {p.isActive ? 'Deactivate' : 'Activate'}
                  </button>
                  <button
                    type="button"
                    onClick={() => setToDelete(p)}
                    aria-label={`Delete ${p.name}`}
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
              <table className="w-full min-w-[760px]">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="th">Name</th>
                    <th className="th">Username</th>
                    <th className="th">Status</th>
                    <th className="th">Created</th>
                    <th className="th">Contacted</th>
                    <th className="th">Last activity</th>
                    <th className="th text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {pas.map((p) => (
                    <tr key={p.id} className="hover:bg-slate-50/60">
                      <td className="td font-medium text-slate-900">{p.name}</td>
                      <td className="td">{p.username}</td>
                      <td className="td">
                        <button type="button" onClick={() => toggleActive(p)} title="Click to toggle status">
                          <ActiveBadge active={p.isActive} />
                        </button>
                      </td>
                      <td className="td whitespace-nowrap">{fmtDate(p.createdAt)}</td>
                      <td className="td font-semibold text-slate-800">{p.totalContacted}</td>
                      <td className="td whitespace-nowrap">{p.lastActivity ? fmtDateTime(p.lastActivity) : 'No activity yet'}</td>
                      <td className="td">
                        <div className="flex justify-end gap-1">
                          <button
                            type="button"
                            onClick={() => setFormFor(p)}
                            aria-label={`Edit ${p.name}`}
                            className="rounded p-2 text-slate-500 hover:bg-slate-100"
                          >
                            <Pencil className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleActive(p)}
                            aria-label={p.isActive ? `Deactivate ${p.name}` : `Activate ${p.name}`}
                            title={p.isActive ? 'Deactivate' : 'Activate'}
                            className="rounded p-2 text-slate-500 hover:bg-slate-100"
                          >
                            <Power className="h-4 w-4" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setToDelete(p)}
                            aria-label={`Delete ${p.name}`}
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

      <PAForm open={formFor !== undefined} pa={formFor || null} onClose={() => setFormFor(undefined)} onSaved={reload} />
      <ConfirmDialog
        open={Boolean(toDelete)}
        title="Delete PA account"
        message={toDelete ? `Delete ${toDelete.name} (${toDelete.username})? They will no longer be able to sign in. Enquiries they contacted keep their history.` : ''}
        loading={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}
