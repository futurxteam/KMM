import { Link } from 'react-router-dom'

export default function AuthLayout({ title, subtitle, children, switchTo }) {
  return (
    <div className="grid min-h-screen place-items-center bg-gradient-to-br from-brand-900 via-brand-700 to-brand-500 p-4">
      <div className="w-full max-w-md rounded-2xl bg-white p-5 shadow-2xl sm:p-8">
        <div className="mb-6 text-center">
          <img
            src="/kmm.webp"
            alt="KMM College of Arts and Science"
            className="mx-auto mb-3 h-14 w-auto object-contain sm:h-16"
          />
          <h1 className="mt-1 text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        {children}
        {switchTo && (
          <p className="mt-6 text-center text-xs text-slate-500">
            <Link to={switchTo.to} className="font-medium text-brand-600 hover:underline">
              {switchTo.label}
            </Link>
          </p>
        )}
      </div>
    </div>
  )
}

