import { useCallback, useEffect, useRef, useState } from 'react'
import { getErrorInfo } from '../services/api'

// Runs `fn()` on mount and whenever deps change; ignores stale responses.
export default function useAsync(fn, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const seq = useRef(0)
  const fnRef = useRef(fn)

  useEffect(() => {
    fnRef.current = fn
  })

  const depKey = JSON.stringify(deps)

  const reload = useCallback(() => {
    const id = ++seq.current
    setLoading(true)
    setError('')
    return Promise.resolve()
      .then(() => fnRef.current())
      .then((result) => {
        if (id === seq.current) setData(result)
      })
      .catch((e) => {
        if (id === seq.current) setError(getErrorInfo(e).message)
      })
      .finally(() => {
        if (id === seq.current) setLoading(false)
      })
  }, [])

  useEffect(() => {
    const id = ++seq.current
    Promise.resolve(depKey)
      .then(() => {
        if (id === seq.current) {
          setLoading(true)
          setError('')
        }
        return fnRef.current()
      })
      .then((result) => {
        if (id === seq.current) setData(result)
      })
      .catch((e) => {
        if (id === seq.current) setError(getErrorInfo(e).message)
      })
      .finally(() => {
        if (id === seq.current) setLoading(false)
      })
  }, [depKey])

  return { data, loading, error, reload, setData }
}
