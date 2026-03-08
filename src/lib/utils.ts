export function cx(...classNames: Array<string | false | null | undefined>) {
  return classNames.filter(Boolean).join(' ')
}

function normalizeShortcutToken(token: string) {
  return token.trim().toLowerCase().replace(/\s+/g, '')
}

function normalizePrimaryKey(token: string) {
  const normalized = normalizeShortcutToken(token)

  switch (normalized) {
    case 'cmd':
    case 'command':
    case 'meta':
      return 'meta'
    case 'ctrl':
    case 'control':
      return 'ctrl'
    case 'cmdorctrl':
    case 'commandorcontrol':
      return 'cmdorctrl'
    case 'alt':
    case 'option':
      return 'alt'
    case 'shift':
      return 'shift'
    case 'esc':
      return 'escape'
    case 'spacebar':
      return ' '
    default:
      return normalized
  }
}

export function normalizeShortcut(shortcut: string) {
  return shortcut
    .split('+')
    .map(normalizePrimaryKey)
    .filter(Boolean)
    .sort()
    .join('+')
}

export function shortcutsConflict(left: string, right: string) {
  if (!left.trim() || !right.trim()) {
    return false
  }

  return normalizeShortcut(left) === normalizeShortcut(right)
}

export function matchesShortcut(event: KeyboardEvent, shortcut: string) {
  const tokens = shortcut
    .split('+')
    .map(normalizePrimaryKey)
    .filter(Boolean)

  if (tokens.length === 0) {
    return false
  }

  const wantsMeta = tokens.includes('meta')
  const wantsCtrl = tokens.includes('ctrl')
  const wantsAlt = tokens.includes('alt')
  const wantsShift = tokens.includes('shift')
  const wantsCmdOrCtrl = tokens.includes('cmdorctrl')
  const primaryKey = tokens.find((token) => !['meta', 'ctrl', 'alt', 'shift', 'cmdorctrl'].includes(token))

  if (wantsMeta !== event.metaKey) {
    return false
  }

  if (wantsCtrl !== event.ctrlKey) {
    return false
  }

  if (wantsAlt !== event.altKey) {
    return false
  }

  if (wantsShift !== event.shiftKey) {
    return false
  }

  if (wantsCmdOrCtrl && !(event.metaKey || event.ctrlKey)) {
    return false
  }

  if (!wantsCmdOrCtrl && !wantsMeta && event.metaKey) {
    return false
  }

  if (!wantsCmdOrCtrl && !wantsCtrl && event.ctrlKey) {
    return false
  }

  if (!primaryKey) {
    return true
  }

  return normalizePrimaryKey(event.key) === primaryKey
}
