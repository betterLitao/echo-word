export const zhCN = {
  'settings.page.eyebrow': '设置',
  'settings.page.title': '个性化配置',
  'settings.page.description': '自定义翻译源、快捷键、词典和界面偏好，让 EchoWord 更符合你的使用习惯。',
  'settings.meta.cycle': '',
  'settings.meta.sentence': '',
  'settings.meta.shortcut': '',
  'settings.tab.general': '通用',
  'settings.tab.translation': '翻译源',
  'settings.tab.shortcut': '快捷键',
  'settings.tab.dictionary': '词典',
  'settings.general.title': '通用设置',
  'settings.general.status': '当前状态',
  'settings.general.language.label': '界面语言',
  'settings.general.language.description': '选择界面显示语言',
  'settings.general.popup.label': '弹窗位置',
  'settings.general.popup.description': '记录拖拽后的最后位置，重置后恢复跟随鼠标',
} as const

export type I18nKey = keyof typeof zhCN
