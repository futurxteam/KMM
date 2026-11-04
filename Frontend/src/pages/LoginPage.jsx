import { Navigate, useNavigate } from 'react-router-dom'
import AuthLayout from '../layouts/AuthLayout'
import LoginForm from '../components/LoginForm'
import useAuth from '../hooks/useAuth'
import { HOME_BY_ROLE, ROLES } from '../utils/constants'

const CONFIG = {
  [ROLES.ADMIN]: {
    title: 'Admin Login',
    subtitle: 'Sign in to manage enquiries and PA accounts',
    label: 'Username or email',
    placeholder: 'admin@college.edu',
    switchTo: { to: '/pa/login', label: 'Are you a PA? Go to PA login' },
  },
  [ROLES.PA]: {
    title: 'PA Login',
    subtitle: 'Sign in to follow up on student enquiries',
    label: 'Username',
    placeholder: 'Your username',
    switchTo: { to: '/admin/login', label: 'Administrator? Go to Admin login' },
  },
}

export default function LoginPage({ role }) {
  const { user, login, sessionExpired } = useAuth()
  const navigate = useNavigate()
  const c = CONFIG[role]

  if (user) return <Navigate to={HOME_BY_ROLE[user.role]} replace />

  const handleSubmit = async (credentials) => {
    const u = await login(role, credentials)
    navigate(HOME_BY_ROLE[u.role], { replace: true })
  }

  return (
    <AuthLayout title={c.title} subtitle={c.subtitle} switchTo={c.switchTo}>
      <LoginForm
        identifierLabel={c.label}
        identifierPlaceholder={c.placeholder}
        onSubmit={handleSubmit}
        notice={sessionExpired ? 'Your session has expired. Please sign in again.' : ''}
      />
    </AuthLayout>
  )
}

