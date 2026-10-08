import { useEffect, useState } from 'react'

/** Counts up seconds while `running`; resets to 0 whenever `resetKey` changes. */
export function useTimer(running: boolean, resetKey: number): number {
  const [seconds, setSeconds] = useState(0)

  useEffect(() => {
    setSeconds(0)
  }, [resetKey])

  useEffect(() => {
    if (!running) return
    const id = setInterval(() => setSeconds((s) => s + 1), 1000)
    return () => clearInterval(id)
  }, [running, resetKey])

  return seconds
}

export function formatTime(totalSeconds: number): string {
  const minutes = Math.floor(totalSeconds / 60).toString().padStart(2, '0')
  const seconds = (totalSeconds % 60).toString().padStart(2, '0')
  return `${minutes}:${seconds}`
}
