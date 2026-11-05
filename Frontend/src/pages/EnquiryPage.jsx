import EnquiryForm from '../components/EnquiryForm'

export default function EnquiryPage() {
  return (
    <div className="min-h-screen px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <div className="mb-6 text-center">
          <img
            src="/kmm.webp"
            alt="KMM College of Arts and Science, Thrikkakara"
            className="mx-auto mb-3 h-16 w-auto object-contain sm:h-20"
          />
          <h1 className="mt-1 text-2xl font-bold text-slate-900 sm:text-3xl">Admission Enquiry</h1>
          <p className="mt-1 text-sm text-slate-500">Fill in your details and we will get back to you.</p>
        </div>
        <EnquiryForm />
      </div>
    </div>
  )
}

