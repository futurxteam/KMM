import { useCallback, useEffect, useState } from 'react'
import { fetchCourses } from '../services/enquiryService'

// Active courses come from the backend (MongoDB). Re-fetched when the tab regains focus
// so newly added/deactivated courses show up without a manual reload.
export default function useCourses() {
  const [courses, setCourses] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = useCallback((silent = false) => {
    if (!silent) setLoading(true)
    return fetchCourses()
      .then((list) => {
        setCourses(list)
        setError('')
      })
      .catch(() => {
        setError('Unable to load courses. Please try again.')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [])

  useEffect(() => {
    let active = true
    fetchCourses()
      .then((list) => {
        if (!active) return
        setCourses(list)
        setError('')
      })
      .catch(() => {
        if (active) setError('Unable to load courses. Please try again.')
      })
      .finally(() => {
        if (active) setLoading(false)
      })

    const onVisible = () => {
      if (document.visibilityState === 'visible') load(true)
    }
    document.addEventListener('visibilitychange', onVisible)
    return () => {
      active = false
      document.removeEventListener('visibilitychange', onVisible)
    }
  }, [load])

  return { courses, loading, error, reload: load }
}
