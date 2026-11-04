import { useCallback, useEffect, useState } from 'react'
import { fetchCourses } from '../services/enquiryService'

// Active courses come from the backend (MongoDB). Re-fetched when the tab regains focus
// so newly added/deactivated courses show up without a manual reload.
export default function useCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true)
    try {
      setCourses(await fetchCourses())
      setError('')
    } catch {
      setError('Unable to load courses. Please try again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    load()
    const onVisible = () => document.visibilityState === 'visible' && load(true)
    document.addEventListener('visibilitychange', onVisible)
    return () => document.removeEventListener('visibilitychange', onVisible)
  }, [load])

  return { courses, loading, error, reload: load }
}
