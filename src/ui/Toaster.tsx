import { useEffect, useState } from 'react'
import { Icon } from '@/icons/Icon'

type Toast = { id: number; message: string }

let pushToast: ((message: string) => void) | null = null
let seq = 1

export function toast(message: string) {
  pushToast?.(message)
}

export function Toaster() {
  const [items, setItems] = useState<Toast[]>([])

  useEffect(() => {
    pushToast = (message) => {
      const id = seq++
      setItems((prev) => [...prev, { id, message }])
      window.setTimeout(() => {
        setItems((prev) => prev.filter((t) => t.id !== id))
      }, 2600)
    }
    return () => {
      pushToast = null
    }
  }, [])

  return (
    <div className="toasts" aria-live="polite">
      {items.map((t) => (
        <div key={t.id} className="toast">
          <Icon name="check" />
          {t.message}
        </div>
      ))}
    </div>
  )
}
