import { useCallback, useEffect, useRef, useState } from 'react'
import { getErrorInfo } from '../services/api'

// Runs `fn(...deps)` on mount and whenever deps change; ignores stale responses.
export default function useAsync(fn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const seq = useRef(0)

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const run = useCallback(async () => {
    const id = ++seq.current
    setLoading(true)
    setError('')
    try {
      const result = await fn()
      if (id === seq.current) setData(result)
    } catch (e) {
      if (id === seq.current) setError(getErrorInfo(e).message)
    } finally {
      if (id === seq.current) setLoading(false)
    }
  }, deps)

  useEffect(() => {
    run()
  }, [run])

  return { data, loading, error, reload: run, setData }
}

