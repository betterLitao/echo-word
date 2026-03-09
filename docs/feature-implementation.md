# EchoWord 功能实现流程文档

## 0. 分析范围与结论

本次文档基于当前仓库中的 `src/`、`src-tauri/`、`docs/PRD.md`、`docs/technical-design.md` 与 `docs/cycles/` 更新，并纳入第一轮优化的实际落地结果。

**当前结论：**
- 项目主链路已形成闭环：双窗口、全局快捷键、输入翻译、单词翻译、句子翻译、收藏、历史、本地 HTTP API、剪贴板监听均有实际实现。
- 第一轮优化已补齐一批之前的致命缺口：
  - `translation-error` 事件已闭环；
  - popup 已支持鼠标附近定位与屏幕边界检测；
  - Windows 下已新增基于 `Ctrl+C` 的“选中自动弹窗”简化方案；
  - `privacy_mode` 已真正影响历史入库；
  - `auto_update`、`dictionary_version`、`data_dir` 的“假生效”问题已通过禁用 UI 和提示文案纠偏。
- 当前实现整体可归类为 **P0 完整度显著提升 + 部分 P1 已落地**。

---

## 1. 项目结构概览

### 1.1 总体结构

```text
echo-word/
├─ docs/                         # PRD、技术设计、周期规划、实现文档
├─ src/                          # React + TypeScript 前端
│  ├─ main.tsx                   # 主窗口入口
│  ├─ popup.tsx                  # 弹窗窗口入口
│  ├─ App.tsx                    # 路由与主框架
│  ├─ pages/                     # 页面层
│  ├─ components/                # 业务组件与 UI 组件
│  ├─ stores/                    # Zustand 状态管理
│  ├─ lib/                       # Tauri 桥接、TTS、工具
│  ├─ hooks/                     # 主题/收藏等 Hook
│  └─ styles/                    # 全局样式
├─ src-tauri/                    # Tauri v2 + Rust 后端
│  ├─ src/lib.rs                 # 应用装配入口
│  ├─ src/commands/              # Tauri commands
│  ├─ src/services/              # 翻译、缓存、快捷键、剪贴板、选区监听等服务
│  ├─ src/api/                   # 翻译源适配层
│  ├─ src/db/                    # SQLite 连接与 migration
│  ├─ src/http_server/           # 本地 HTTP API
│  ├─ src/utils/                 # 平台与轻量加密工具
│  ├─ resources/ecdict-core.db   # 内置 ECDICT 离线词典
│  └─ tauri.conf.json            # 多窗口与构建配置
└─ package.json / Cargo.toml     # 前后端依赖
```

### 1.2 技术栈

- 前端：React 19、TypeScript、React Router、Zustand、Framer Motion
- 后端：Tauri v2、Rust、rusqlite、reqwest、tiny_http、lru
- 桌面能力：双窗口、系统托盘、全局快捷键、本地 HTTP API、剪贴板监听、Windows 选区简化监听

### 1.3 多窗口模型

- 主窗口入口：`src/main.tsx`
- 弹窗窗口入口：`src/popup.tsx`
- Tauri 侧定义 `main` 与 `popup` 两个窗口
- `popup` 为无边框、透明、置顶、隐藏任务栏窗口，用于展示翻译气泡
- 第一轮优化后，`popup` 已支持根据当前鼠标位置进行定位，并做屏幕边界裁剪

---

## 2. 已实现功能清单

### 2.1 已明确实现的核心模块

| 模块 | 实现情况 | 说明 |
|---|---|---|
| 应用双窗口 | 已实现 | `main` + `popup` 分离，前端分别挂载 |
| 首次启动引导 | 已实现 | 欢迎、权限、API Key、快捷键、完成 |
| 设置中心 | 已实现 | 通用、翻译源、快捷键、词典四个 Tab |
| 输入翻译工作台 | 已实现 | 主窗口内手动输入翻译、模式切换、结果展示 |
| 输入翻译弹层 | 已实现 | 由后端事件唤起，支持自动翻译与推送 popup |
| 单词翻译 | 已实现 | ECDICT 离线词典 + 音标 + 中文谐音 |
| 句子翻译 | 已实现 | DeepL / OpenAI / Tencent / Baidu provider 链 |
| 翻译缓存 | 已实现 | 句子翻译走 LRU 内存缓存 |
| 降级链 | 已实现 | 句子翻译按主 provider + fallback_chain 尝试 |
| 多引擎对照 | 已实现 | 最多 3 个 provider，对照结果进入 `alternatives` |
| 开发者命名拆分 | 已实现 | camelCase / snake_case / path-like 拆分 |
| 收藏管理 | 已实现 | SQLite 持久化，支持新增、删除、列表、回放 |
| 历史记录 | 已实现 | SQLite 持久化，支持查询、分页、回放 |
| 全局快捷键 | 已实现 | 系统级注册，翻译与输入两个入口 |
| 剪贴板监听 | 已实现 | 后台轮询剪贴板，检测新文本后触发翻译 |
| 选中自动弹窗（简化方案） | 已实现 | Windows 下检测 `Ctrl+C`，读取剪贴板并自动弹出翻译 |
| 弹窗坐标定位 | 已实现 | `show_popup_near_cursor` 跟随鼠标 + 边界检测 |
| translation-error 事件闭环 | 已实现 | 翻译失败时后端 emit，popup 可展示错误状态 |
| 系统托盘 | 已实现 | 显示主窗口、设置、退出 |
| 本地 HTTP API | 已实现 | `/translate`、`/selection_translate`、`/input_translate` |
| API Key 本地加密存储 | 已实现但较弱 | 轻量混淆，不是系统级密钥库 |
| 主题切换 | 已实现 | `system / dark / light` |
| privacy_mode 历史抑制 | 已实现 | 开启后跳过历史写入 |
| 设置假生效纠偏 | 已实现 | `auto_update` / `dictionary_version` / `data_dir` 已禁用并标注“即将支持” |

### 2.2 部分实现模块

| 模块 | 实现判断 | 实际情况 |
|---|---|---|
| 辅助功能权限 | 部分实现 | 已有检测与跳转，但未实现真正的系统级选区 API 监听 |
| 朗读 | 部分实现 | 使用浏览器 `speechSynthesis`，不是 Rust 统一桌面能力 |
| 腾讯/百度句子翻译 | 部分实现 | 调度链已接入，但更偏开发占位而非正式生产实现 |

### 2.3 未实现模块

| 模块 | 结论 |
|---|---|
| 有道词典单词 fallback | 未实现 |
| Ollama 本地模型 | 未实现 |
| OpenAI 流式输出 | 未实现 |
| 词典下载与进度通知 | 未实现 |
| 收藏导出 | 未实现 |
| 开机自启 | 未实现 |
| 自动更新能力本体 | 未实现 |
| 截图翻译（P2） | 未实现 |
| 同步冲突处理 | 未实现 |

---

## 3. 核心功能流程图（文字描述）

### 3.1 应用启动流程

**流程：**  
Tauri 启动  
→ 运行 migration  
→ 创建托盘  
→ 接入全局快捷键插件  
→ 刷新快捷键注册  
→ 读取设置  
→ 启动本地 HTTP 服务  
→ 启动 Windows 选区简化 watcher  
→ 启动剪贴板 watcher  
→ 主窗口显示

**说明：**
- 第一轮优化后，`selection` watcher 与原有 `clipboard` watcher 并行存在。
- `selection` watcher 不替代快捷键与剪贴板监听，而是新增一条补充触发入口。

### 3.2 首次启动引导流程

**流程：**  
应用进入主前端  
→ 读取 settings  
→ 若 `onboarding_completed = false`  
→ 进入 Onboarding  
→ 欢迎页  
→ 权限检查页  
→ API Key 配置页  
→ 快捷键预览页  
→ 完成后写回 `onboarding_completed = true`  
→ 跳转 `/settings`

### 3.3 快捷键翻译流程

**流程：**  
用户在任意应用中复制文本或先选中文本  
→ 按全局翻译快捷键  
→ Rust 快捷键回调触发  
→ 读取系统剪贴板  
→ 调用统一翻译服务  
→ 成功时 emit `translation-result`  
→ popup 定位到鼠标附近并显示  
→ popup 渲染翻译结果  
→ 失败时 emit `translation-error`  
→ popup 显示错误气泡

### 3.4 剪贴板监听自动翻译流程

**流程：**  
后台线程轮询剪贴板  
→ 若 `clipboard_listen = true`  
→ 读取当前剪贴板文本  
→ 过滤空文本、超长文本、无英文文本、重复文本  
→ 复用 `request_selection_translate_internal` 入口  
→ 触发统一翻译与 popup 展示流程

**说明：**
- 这条链路仍保留，是“持续监听模式”。
- 与新增的选区简化监听互不替代。

### 3.5 选区监听自动弹窗流程（第一轮优化新增）

**流程：**  
Windows 后台 watcher 轮询键盘状态  
→ 检测到用户按下 `Ctrl+C`  
→ 在短时间窗口内读取剪贴板  
→ 过滤空文本、超长文本、非英文文本、重复文本  
→ 调用 `request_selection_translate_internal(app, "selection-auto")`  
→ 进入统一翻译链路  
→ 成功则 emit `translation-result` 并定位 popup  
→ 失败则 emit `translation-error` 并定位 popup

**特点：**
- 这是对 PRD“选中自动弹窗”能力的**第一阶段简化落地**。
- 当前不是 Accessibility / UI Automation 的系统级精确选区监听，而是基于 `Ctrl+C` 的用户行为近似实现。
- 优点是实现成本低、兼容现有架构、不会破坏原有快捷键和剪贴板监听。

### 3.6 输入翻译弹层流程

**流程：**  
后端触发 `request_input_translate`  
→ Rust 发出 `input-translate-requested` 事件  
→ 前端 `InputTranslateDialog` 打开  
→ textarea 聚焦  
→ 用户输入文本  
→ 若开启 `autoRun`，500ms 防抖后自动翻译  
→ 否则手动点击翻译  
→ 调 `invoke('translate')`  
→ 成功后渲染结果  
→ 可“推送到 popup”并关闭弹层

### 3.7 单词翻译流程

**流程：**  
前端调用 `translate(text, mode)`  
→ Rust `translator::translate` 收到请求  
→ 若不是 sentence 强制模式，先判断是否像开发者命名  
→ 若是 camelCase / snake_case / path-like，走拆分翻译  
→ 否则判定为单词模式  
→ ECDICT 离线词典查询  
→ 取音标  
→ 生成中文谐音  
→ 拆分释义  
→ 若 `privacy_mode = false` 则写入 history  
→ 返回前端

### 3.8 句子翻译流程

**流程：**  
前端发起翻译  
→ Rust 读取 settings  
→ 计算主 provider + fallback_chain  
→ 若启用多引擎，选取最多 3 个 target  
→ 依次执行 provider  
→ 每个 provider 先查内存缓存  
→ 命中则直接返回  
→ 未命中则走 HTTP 请求  
→ 收集成功项与失败项  
→ 生成主结果与 `alternatives`  
→ 若 `privacy_mode = false` 则写入 history  
→ 返回前端

### 3.9 Popup 展示与错误处理流程

**成功流程：**  
收到 `translation-result`  
→ popup 清理临时错误态  
→ 写入当前窗口 store  
→ 根据 `mode` 渲染 `WordResult` 或 `SentenceResult`

**失败流程：**  
后端翻译失败  
→ emit `translation-error`  
→ popup 清空旧结果  
→ 设置 `eventError`  
→ 展示错误信息卡片

### 3.10 收藏与历史流程

#### 收藏流程
前端构造 `FavoriteItem`  
→ 调 `add_favorite`  
→ SQLite `favorites` 表 upsert  
→ 收藏页分页查询  
→ 支持删除  
→ 支持回放到主工作台再次翻译

#### 历史流程
翻译完成  
→ 若 `privacy_mode = false` 调 `store_history`  
→ SQLite `history` 表入库  
→ 历史页分页查询  
→ 支持回放到主工作台再次翻译

---

## 4. 前后端交互说明

### 4.1 交互总览

当前项目前后端通信分四层：

| 方式 | 方向 | 用途 |
|---|---|---|
| Tauri `invoke` | 前端 → Rust | 命令式请求/响应 |
| Tauri `event` | Rust → 前端、前端 → 前端窗口 | 异步广播、跨窗口同步 |
| 本地 HTTP API | 外部工具 → Rust | Alfred / Raycast / 脚本调用 |
| 浏览器原生 API | 前端本地 | 复制、朗读、主题 |

### 4.2 Tauri Commands

统一注册在 Rust 入口，覆盖设置、翻译、收藏、历史、窗口控制等能力。

### 4.3 Tauri Events

#### 已实际使用并闭环的事件
- `input-translate-requested`
- `translation-result`
- `translation-error`

#### 第一轮优化后的变化
- `translation-error` 现在由后端在翻译失败时主动 emit。
- popup 不再只是监听该事件，而是能真正将其展示为错误状态。

### 4.4 本地 HTTP API

当前接口：
- `POST /translate`：直接翻译文本
- `GET /selection_translate`：触发“读剪贴板并翻译”
- `GET /input_translate`：唤起输入翻译弹层

### 4.5 浏览器原生 API

- 复制：`navigator.clipboard.writeText(...)`
- 朗读：`speechSynthesis`
- 主题：`useTheme()` 跟随系统 / 手动切换

---

## 5. 关键代码文件说明

### 5.1 后端核心文件

| 文件 | 职责 |
|---|---|
| `src-tauri/src/lib.rs` | Tauri 应用装配入口；负责 migration、托盘、快捷键、HTTP server、selection watcher、clipboard watcher、commands 注册 |
| `src-tauri/src/commands/settings.rs` | 设置读写、权限检测、窗口显隐、popup 显示定位入口 |
| `src-tauri/src/commands/translate.rs` | 统一翻译命令、popup 定位显示、错误事件发送、输入弹层请求、剪贴板翻译入口 |
| `src-tauri/src/services/translator.rs` | 翻译总调度中心；负责 auto 模式、命名拆分、单词/句子分发、history 入库控制 |
| `src-tauri/src/services/selection.rs` | Windows 下 `Ctrl+C` 选区简化监听 |
| `src-tauri/src/services/cache.rs` | 句子翻译缓存 |
| `src-tauri/src/services/phonetic.rs` | IPA → 中文谐音映射 |
| `src-tauri/src/services/dev_name.rs` | 开发者命名拆分与识别 |
| `src-tauri/src/services/runtime.rs` | 全局快捷键注册与事件处理 |
| `src-tauri/src/services/clipboard.rs` | 剪贴板监听线程 |
| `src-tauri/src/http_server/mod.rs` | 本地 HTTP API 服务 |
| `src-tauri/src/api/ecdict.rs` | 离线词典 provider |
| `src-tauri/src/api/deepl.rs` | DeepL 句子翻译 |
| `src-tauri/src/api/openai.rs` | OpenAI 句子翻译 |
| `src-tauri/src/db/connection.rs` | SQLite 连接 |
| `src-tauri/src/db/migration.rs` | schema 初始化与默认设置写入 |

### 5.2 前端核心文件

| 文件 | 职责 |
|---|---|
| `src/main.tsx` | 主窗口 React 入口 |
| `src/popup.tsx` | popup 窗口 React 入口 |
| `src/App.tsx` | 主框架、路由、导航 |
| `src/lib/tauri.ts` | 前后端桥接层 |
| `src/stores/translationStore.ts` | 翻译业务主 store |
| `src/stores/settingsStore.ts` | 设置主 store |
| `src/components/settings/TranslationWorkbench.tsx` | 主工作台 |
| `src/components/translation/InputTranslateDialog.tsx` | 输入翻译弹层 |
| `src/components/popup/PopupWindow.tsx` | popup 总控与错误态展示 |
| `src/pages/OnboardingPage.tsx` | 引导页面 |
| `src/pages/FavoritesPage.tsx` | 收藏页面 |
| `src/pages/HistoryPage.tsx` | 历史页面 |
| `src/components/settings/GeneralTab.tsx` | 通用设置与“假生效”纠偏 |
| `src/components/settings/DictionaryTab.tsx` | 词典设置与“即将支持”占位 |

---

## 6. 与原始设计的对比

### 6.1 与 `docs/PRD.md` 的对比

| PRD 项 | 实际实现 | 判断 |
|---|---|---|
| 全局快捷键（P0） | 已实现，依赖读剪贴板 | 基本满足 |
| 鼠标选中自动弹窗（P0） | 已实现第一阶段简化方案：Windows `Ctrl+C` → 读剪贴板 → 自动弹窗 | 已实现（简化方案） |
| 输入翻译（P0） | 主工作台 + 输入弹层 | 已实现 |
| 剪贴板监听（P1） | 轮询 watcher | 已实现 |
| 智能模式判断 | `auto` 模式按空白判断 | 已实现 |
| 单词翻译 | 只有 ECDICT，无有道 fallback | 部分实现 |
| 句子翻译 | DeepL / OpenAI 真接入，腾讯 / 百度半成品 | 部分实现 |
| 多引擎对照（P1） | 最多 3 个 provider | 已实现 |
| 开发者命名拆分（P1） | camelCase / snake_case / path-like | 已实现 |
| 音标中文谐音 | IPA 映射 | 已实现 |
| 翻译失败提示 | popup 已可展示后端错误事件 | 已实现 |
| 弹窗跟随选区附近 | 已实现鼠标附近定位 + 边界检测 | 已实现（近似满足） |
| privacy_mode | 开启后跳过 history 写入 | 已实现 |
| 自动更新设置 | 功能本体未实现，但 UI 已禁用并标注“即将支持” | 已纠偏 |
| 词典版本切换设置 | 下载/切换本体未实现，但 UI 已禁用并标注“即将支持” | 已纠偏 |
| 数据目录设置 | 目录迁移本体未实现，但 UI 已禁用并标注“即将支持” | 已纠偏 |
| 流式响应 | 仍为阻塞式一次性返回 | 未实现 |
| 收藏导出 | 暂无 | 未实现 |
| 数据同步 | 暂无 | 未实现 |
| 开机自启 | 暂无 | 未实现 |
| 自动更新能力本体 | 暂无 | 未实现 |
| 截图翻译（P2） | 暂无 | 未实现 |

### 6.2 与 `docs/technical-design.md` 的对比

| 技术设计项 | 实际实现 | 判断 |
|---|---|---|
| `translation-error` 事件链 | 后端 emit + 前端 popup 消费 | 已实现 |
| popup 定位能力 | `show_popup_near_cursor` 已接入 | 已实现 |
| 外部 selection 自动触发 | 新增 `selection.rs`，Windows 下基于 `Ctrl+C` 简化落地 | 已实现（简化方案） |
| `privacy_mode` 生效 | `store_history` 前检查设置并跳过落库 | 已实现 |
| updater 插件 | 无依赖 | 未实现 |
| autostart 插件 | 无依赖 | 未实现 |
| ring 加密 | 仍为轻量混淆 | 降级实现 |
| youdao.rs | 无该文件 | 未实现 |
| tts.rs | 前端 Web Speech 替代 | 未实现 |
| download_dictionary command | 暂无 | 未实现 |
| 数据目录可配置 | 功能本体未实现，UI 已禁用避免误导 | 已纠偏 |
| 词典下载进度事件 | 暂无 | 未实现 |
| 同步冲突处理 | 暂无 | 未实现 |

---

## 7. 技术评估

### 7.1 当前优势

- 主链路更完整：成功态、失败态、popup 显示态都已闭环。
- 低成本补齐 P0：通过 `Ctrl+C` 近似方案把“选中自动弹窗”从完全缺失拉到可用状态。
- 风险控制更好：把三个“假生效设置”显式降级，避免误导用户。
- 隐私逻辑开始真正影响后端行为，而不只是 UI 开关。

### 7.2 当前风险

- 选区监听仍是近似实现，不是系统级选区 API 真监听。
- popup 位置跟随鼠标，不等于精确跟随文字选区矩形。
- `privacy_mode` 仅影响历史，不影响收藏、缓存、外部调用等其他数据面。
- 自动更新、词典切换、数据目录迁移依旧没有能力本体，只是 UI 不再误导。

---

## 8. 一句话总结

当前 EchoWord 已从“主链路能跑”升级到“主链路更像一个可交付的 P0 桌面翻译工具”：翻译成功与失败都有反馈，popup 能跟随鼠标定位，Windows 下已有选区自动弹窗的简化落地，`privacy_mode` 开始真正生效，同时几个容易误导用户的设置项也完成了第一轮纠偏。
