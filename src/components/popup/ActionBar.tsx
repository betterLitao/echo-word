import type { Ref } from 'react'
import { HeartStraight, SpeakerHigh } from '@phosphor-icons/react'
import { Button } from '../ui/Button'

interface ActionBarProps {
  favoriteLabel?: string
  showFavorite?: boolean
  containerRef?: Ref<HTMLDivElement>
  onFavorite?: () => void
  onSpeak?: () => void
}

export function ActionBar({
  favoriteLabel = '收藏',
  showFavorite = true,
  containerRef,
  onFavorite,
  onSpeak,
}: ActionBarProps) {
  return (
    <div ref={containerRef} className="flex flex-wrap items-center gap-2">
      <Button data-popup-action="speak" icon={<SpeakerHigh size={16} weight="duotone" />} size="sm" variant="ghost" onClick={onSpeak}>
        朗读
      </Button>
      {showFavorite ? (
        <Button data-popup-action="favorite" icon={<HeartStraight size={16} weight="duotone" />} size="sm" variant="secondary" onClick={onFavorite}>
          {favoriteLabel}
        </Button>
      ) : null}
    </div>
  )
}
