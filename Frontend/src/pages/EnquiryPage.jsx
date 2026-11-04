import { GraduationCap } from 'lucide-react'
import EnquiryForm from '../components/EnquiryForm'

export default function EnquiryPage() {
  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <div className="mx-auto mb-3 grid h-12 w-12 place-items-center rounded-full bg-brand-100 text-brand-600">
            <GraduationCap className="h-6 w-6" />
          </div>
          <p className="text-xs font-semibold uppercase tracking-wider text-brand-600">
            KMM College of Arts and Science, Thrikkakara
          </p>
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Admission Enquiry</h1>
          <p className="mt-1 text-sm text-slate-500">Fill in your details and we will get back to you.</p>
        </div>
        <EnquiryForm />
      </div>
    </div>
  )
}

