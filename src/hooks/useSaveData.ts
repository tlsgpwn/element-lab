import { useContext } from 'react'
import { SaveContext, type SaveContextValue } from './saveContext'

export function useSaveData(): SaveContextValue {
  const ctx = useContext(SaveContext)
  if (!ctx) throw new Error('useSaveData는 <SaveProvider> 안에서만 사용할 수 있습니다.')
  return ctx
}
