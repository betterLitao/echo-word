export const zhCN = {
  'settings.page.eyebrow': '设置中心',
  'settings.page.title': '把输入翻译、配置与状态提示放进同一个工作台，而不是拆成互相割裂的页面。',
  'settings.page.description': '当前只接入简化版 i18n，用来验证设置页标题、标签和语言配置链路。别想太多，先把骨架跑通。',
  'settings.meta.cycle': 'Cycle 05',
  'settings.meta.sentence': 'Sentence Flow Ready',
  'settings.meta.shortcut': 'Shortcut Ready',
  'settings.tab.general': '通用',
  'settings.tab.translation': '翻译源',
  'settings.tab.shortcut': '快捷键',
  'settings.tab.dictionary': '词典',
  'settings.general.title': '通用设置',
  'settings.general.status': '当前状态',
  'settings.general.language.label': '界面语言',
  'settings.general.language.description': '先做基础 i18n 框架。当前只示范翻译设置页标题和标签。',
  'settings.general.popup.label': '弹窗位置',
  'settings.general.popup.description': '记录拖拽后的最后位置；重置后恢复跟随鼠标。',
} as const

export type I18nKey = keyof typeof zhCN
