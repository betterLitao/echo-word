import type { Ref } from 'react'
import { Copy, HeartStraight, SpeakerHigh, X } from '@phosphor-icons/react'
import { Button } from '../ui/Button'

interface ActionBarProps {
  copyDisabled?: boolean
  copyLabel?: string
  favoriteLabel?: string
  showFavorite?: boolean
  containerRef?: Ref<HTMLDivElement>
  onCopy?: () => void
  onFavorite?: () => void
  onSpeak?: () => void
  onClose?: () => void
}

export function ActionBar({
  copyDisabled = false,
  copyLabel = '复制',
  favoriteLabel = '收藏',
  showFavorite = true,
  containerRef,
  onCopy,
  onFavorite,
  onSpeak,
  onClose,
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
      <Button data-popup-action="copy" icon={<Copy size={16} weight="duotone" />} size="sm" variant="ghost" disabled={copyDisabled} onClick={onCopy}>
        {copyLabel}
      </Button>
      <Button data-popup-action="close" icon={<X size={16} weight="duotone" />} size="sm" variant="ghost" onClick={onClose}>
        关闭
      </Button>
    </div>
  )
}
