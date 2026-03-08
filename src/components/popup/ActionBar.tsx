interface ActionBarProps {
  favoriteLabel?: string
  showFavorite?: boolean
  onFavorite?: () => void
  onClose?: () => void
}

export function ActionBar({ favoriteLabel = '收藏', showFavorite = true, onFavorite, onClose }: ActionBarProps) {
  return (
    <div className="flex items-center gap-2 text-xs text-slate-300">
      <button className="rounded-full border border-white/10 px-3 py-1.5 hover:bg-white/10">朗读</button>
      {showFavorite ? <button className="rounded-full border border-white/10 px-3 py-1.5 hover:bg-white/10" onClick={onFavorite}>{favoriteLabel}</button> : null}
      <button className="rounded-full border border-white/10 px-3 py-1.5 hover:bg-white/10">复制</button>
      <button className="rounded-full border border-white/10 px-3 py-1.5 hover:bg-white/10" onClick={onClose}>关闭</button>
    </div>
  )
}
