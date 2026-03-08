import { Copy, HeartStraight, SpeakerHigh, X } from '@phosphor-icons/react'
import { Button } from '../ui/Button'

interface ActionBarProps {
  copyDisabled?: boolean
  favoriteLabel?: string
  showFavorite?: boolean
  onCopy?: () => void
  onFavorite?: () => void
  onClose?: () => void
}

export function ActionBar({
  copyDisabled = false,
  favoriteLabel = '收藏',
  showFavorite = true,
  onCopy,
  onFavorite,
  onClose,
}: ActionBarProps) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <Button icon={<SpeakerHigh size={16} weight="duotone" />} size="sm" variant="ghost">朗读</Button>
      {showFavorite ? <Button icon={<HeartStraight size={16} weight="duotone" />} size="sm" variant="secondary" onClick={onFavorite}>{favoriteLabel}</Button> : null}
      <Button icon={<Copy size={16} weight="duotone" />} size="sm" variant="ghost" disabled={copyDisabled} onClick={onCopy}>复制</Button>
      <Button icon={<X size={16} weight="duotone" />} size="sm" variant="ghost" onClick={onClose}>关闭</Button>
    </div>
  )
}
