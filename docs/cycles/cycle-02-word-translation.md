# 开发周期 02：单词翻译闭环

## 周期目标

交付 EchoWord 的第一个核心价值版本：用户输入或调试调用一个英文单词后，能够看到中文释义、音标和中文谐音，并支持一键收藏。

## 本周期范围

### 必做功能

- 接入 `ECDICT` 核心词典并完成只读查询。
- 实现单词翻译结果结构、音标谐音转换和单词模式弹窗展示。
- 完成自动模式下的“单词路径”判断。
- 完成收藏的新增、取消、最小读取能力。
- 完成单词模式的弹窗 UI 与加载/错误态。

### 目标模块

- Rust：`src-tauri/src/api/ecdict.rs`、`src-tauri/src/api/provider.rs`
- 服务：`src-tauri/src/services/translator.rs`、`src-tauri/src/services/phonetic.rs`
- 命令：`src-tauri/src/commands/translate.rs`、`src-tauri/src/commands/favorite.rs`
- 前端：`src/components/popup/WordResult.tsx`、`src/components/popup/ActionBar.tsx`
- Store/Hook：`src/stores/translationStore.ts`、`src/hooks/useTranslation.ts`、`src/hooks/useFavorite.ts`

## 开发任务

### Rust 后端

- 封装 ECDICT 只读连接和词条查询逻辑，支持小写化、精确匹配和基础词形兜底。
- 定义统一的 `TranslationResult`、`WordDetail`、`TranslationMode` 数据结构。
- 实现 `phonetic.rs`，完成 IPA 到中文谐音的混合映射方案。
- 在 `translator.rs` 中先落地“单词模式主链路”：查询词典 → 生成谐音 → 组装结果。
- 实现 `add_favorite`、`remove_favorite`、`get_favorites` 的最小能力。

### 前端 UI

- 建立单词结果卡片，展示单词、音标、谐音、释义和收藏按钮。
- 建立翻译中、词典未命中、系统错误三种状态展示。
- 在弹窗中保留模式切换入口，但本周期只要求单词模式完整可用。
- 补充开发调试入口，便于在未接入快捷键前快速验证单词翻译结果。

### 数据与交互

- 收藏数据写入 `favorites` 表，保证同一个单词不会重复插入。
- 收藏状态在弹窗内即时反馈，避免用户重复点击。
- 翻译结果结构与后续句子模式保持兼容，避免 `Cycle 03` 再次改模型。

### 验证清单

- `ephemeral`、`think` 等示例词可返回稳定结果。
- 包含特殊音素的单词能显示混合谐音提示。
- 收藏新增、取消后数据库状态正确。
- 词典未命中时，前端能展示明确提示，而不是空白弹窗。

## 交付物

- 可用的离线单词翻译能力。
- 可落库的一键收藏能力。
- 可复用到句子翻译阶段的统一翻译结果模型。

## 验收标准

- 单词查询结果可在 50ms 级别内返回（目标值，允许开发环境略高）。
- 单词弹窗同时展示英文、音标、中文谐音和中文释义。
- 收藏行为可持久化，应用重启后仍保留。
- 词典查询失败时不会导致应用崩溃。

## 非本周期范围

- DeepL / 腾讯 / 百度等在线句子翻译
- 全局快捷键与输入翻译
- 缓存、降级链、防抖
- 自动划词弹窗
- 历史记录与朗读

## 风险与依赖

- ECDICT 词条格式需要尽早核对，避免后续词形字段和音标字段解析返工。
- 中文谐音映射要保证规则可扩展，否则后续有道/OpenAI 返回音标时难以统一处理。
- 收藏表结构在本周期即进入真实使用，后续字段变更要通过 Migration 管控。

## 建议 PR 拆分

1. ECDICT 查询层与统一结果模型
2. 音标谐音服务与单词翻译调度
3. 单词弹窗 UI 与前端状态流转
4. 收藏命令与数据库落库
