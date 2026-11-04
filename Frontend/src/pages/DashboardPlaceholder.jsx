import { LogOut } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import useAuth from '../hooks/useAuth'
import { LOGIN_BY_ROLE } from '../utils/constants'

// Temporary landing page; real dashboards arrive in Part 2.
export default function DashboardPlaceholder() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()

  const handleLogout = async () => {
    const role = user.role
    await logout()
    navigate(LOGIN_BY_ROLE[role], { replace: true })
  }

  return (
    <div className="grid min-h-screen place-items-center p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-8 text-center shadow">
        <h1 className="text-xl font-bold">Welcome, {user.name}</h1>
        <p className="mt-1 text-sm text-slate-500">Signed in as {user.role}. The dashboard is coming in Part 2.</p>
        <button
          onClick={handleLogout}
          className="mt-6 inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 text-sm font-medium text-white hover:bg-slate-900"
        >
          <LogOut className="h-4 w-4" /> Log out
        </button>
      </div>
    </div>
  )
}

