import { useEffect } from 'react'
import { useTranslationStore } from '../stores/translationStore'

export function useTranslationDemo() {
  const seedDemo = useTranslationStore((state) => state.seedDemo)

  useEffect(() => {
    seedDemo()
  }, [seedDemo])
}
