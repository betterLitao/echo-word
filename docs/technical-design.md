# EchoWord 技术实现文档

> 基于 PRD v1.0，指导 MVP（P0）及后续迭代的技术实现。

---

## 1. 技术栈与依赖清单

### 1.1 Rust 后端（Cargo.toml）

| 依赖 | 版本 | 用途 |
|------|------|------|
| `tauri` | 2.x | 应用框架 |
| `tauri-plugin-global-shortcut` | 2.x | 全局快捷键注册 |
| `tauri-plugin-clipboard-manager` | 2.x | 剪贴板读写 |
| `tauri-plugin-updater` | 2.x | 自动更新 |
| `tauri-plugin-autostart` | 2.x | 开机自启（P2） |
| `tauri-plugin-shell` | 2.x | 打开系统设置等外部操作 |
| `rusqlite` | 0.31+ | SQLite 数据库操作，启用 `bundled` feature |
| `reqwest` | 0.12+ | HTTP 客户端（翻译 API 调用），启用 `json`, `socks` feature |
| `serde` / `serde_json` | 1.x | 序列化/反序列化 |
| `tokio` | 1.x | 异步运行时（Tauri 2 内置，无需额外引入） |
| `lru` | 0.12+ | LRU 缓存 |
| `tiny-http` | 0.12+ | 外部调用 HTTP 服务（轻量级） |
| `ring` | 0.17+ | API Key 加密存储 |
| `log` / `env_logger` | 0.4+ | 日志 |

### 1.2 前端（package.json）

| 依赖 | 用途 |
|------|------|
| `react` + `react-dom` | UI 框架 |
| `typescript` | 类型安全 |
| `vite` | 构建工具 |
| `@tauri-apps/api` | Tauri 前端 API |
| `@tauri-apps/plugin-global-shortcut` | 快捷键插件前端绑定 |
| `@tauri-apps/plugin-clipboard-manager` | 剪贴板插件前端绑定 |
| `@tauri-apps/plugin-updater` | 自动更新插件前端绑定 |
| `tailwindcss` | 原子化 CSS |
| `shadcn/ui` | 组件库（按需引入，非 npm 安装） |
| `zustand` | 状态管理 |
| `react-router-dom` | 路由（设置页多 tab） |

### 1.3 开发工具

| 工具 | 用途 |
|------|------|
| `@tauri-apps/cli` | Tauri CLI |
| `eslint` + `prettier` | 代码质量 |
| `vitest` | 前端单元测试 |

---

## 2. 项目目录结构

```
echo-word/
├── docs/                          # 文档
│   ├── PRD.md
│   └── technical-design.md
│
├── src/                           # 前端代码
│   ├── main.tsx                   # 主窗口入口
│   ├── popup.tsx                  # 弹窗窗口入口
│   ├── popup.html                 # 弹窗 HTML
│   ├── index.html                 # 主窗口 HTML（Vite 入口）
│   │
│   ├── components/                # UI 组件
│   │   ├── ui/                    # shadcn/ui 组件
│   │   ├── popup/                 # 弹窗相关组件
│   │   │   ├── PopupWindow.tsx    # 弹窗容器
│   │   │   ├── WordResult.tsx     # 单词模式结果
│   │   │   ├── SentenceResult.tsx # 句子模式结果
│   │   │   └── ActionBar.tsx      # 操作栏（朗读/收藏/复制）
│   │   ├── settings/              # 设置页组件
│   │   │   ├── GeneralTab.tsx     # 通用设置
│   │   │   ├── TranslationTab.tsx # 翻译源设置
│   │   │   ├── ShortcutTab.tsx    # 快捷键设置
│   │   │   └── DictionaryTab.tsx  # 词典管理
│   │   └── onboarding/            # 引导页组件
│   │       ├── Stepper.tsx        # 步骤器
│   │       ├── WelcomeStep.tsx    # 欢迎页
│   │       ├── PermissionStep.tsx # 权限申请
│   │       ├── ApiKeyStep.tsx     # API Key 配置
│   │       └── ShortcutStep.tsx   # 快捷键展示
│   │
│   ├── hooks/                     # 自定义 Hooks
│   │   ├── useTranslation.ts      # 翻译操作
│   │   ├── useFavorite.ts         # 收藏操作
│   │   └── useTheme.ts            # 主题切换
│   │
│   ├── stores/                    # zustand 状态
│   │   ├── translationStore.ts    # 翻译状态
│   │   ├── settingsStore.ts       # 设置状态
│   │   └── uiStore.ts            # UI 状态（弹窗可见性等）
│   │
│   ├── lib/                       # 工具函数
│   │   ├── tauri.ts               # Tauri IPC 封装
│   │   └── utils.ts               # 通用工具
│   │
│   └── styles/                    # 样式
│       └── globals.css            # Tailwind 入口 + 全局样式
│
├── src-tauri/                     # Rust 后端
│   ├── Cargo.toml
│   ├── tauri.conf.json            # Tauri 配置
│   ├── capabilities/              # Tauri v2 权限声明
│   │   └── default.json
│   ├── icons/                     # 应用图标
│   │
│   └── src/
│       ├── main.rs                # 入口，注册 commands/plugins/tray
│       ├── lib.rs                 # 库入口，模块声明
│       │
│       ├── commands/              # Tauri IPC Commands
│       │   ├── mod.rs
│       │   ├── translate.rs       # 翻译相关命令
│       │   ├── favorite.rs        # 收藏相关命令
│       │   ├── history.rs         # 历史记录命令
│       │   ├── settings.rs        # 设置相关命令
│       │   └── dictionary.rs      # 词典管理命令
│       │
│       ├── db/                    # 数据库层
│       │   ├── mod.rs
│       │   ├── connection.rs      # 连接管理（单例）
│       │   ├── migration.rs       # Migration 引擎
│       │   └── migrations/        # 迁移脚本
│       │       ├── v001_init.sql
│       │       └── v002_xxx.sql
│       │
│       ├── services/              # 业务逻辑层
│       │   ├── mod.rs
│       │   ├── translator.rs      # 翻译调度（缓存/降级/路由）
│       │   ├── cache.rs           # LRU 缓存
│       │   ├── phonetic.rs        # 音标谐音
│       │   ├── dev_name.rs        # 开发者命名拆分
│       │   └── tts.rs             # 发音朗读
│       │
│       ├── api/                   # 翻译源实现
│       │   ├── mod.rs
│       │   ├── provider.rs        # TranslationProvider trait
│       │   ├── ecdict.rs          # ECDICT 离线词典
│       │   ├── deepl.rs           # DeepL API
│       │   ├── tencent.rs         # 腾讯翻译
│       │   ├── baidu.rs           # 百度翻译
│       │   ├── youdao.rs          # 有道词典
│       │   └── openai.rs          # OpenAI 翻译
│       │
│       ├── http_server/           # 外部调用 HTTP 服务
│       │   ├── mod.rs
│       │   └── routes.rs          # 路由处理
│       │
│       └── utils/                 # 工具
│           ├── mod.rs
│           ├── crypto.rs          # API Key 加密
│           └── platform.rs        # 平台相关（权限检测等）
│
├── resources/                     # 内置资源
│   └── ecdict-core.db            # ECDICT 核心词典（~50MB）
│
├── .github/
│   └── workflows/
│       └── release.yml            # CI/CD 多平台构建
│
├── package.json
├── vite.config.ts
├── tailwind.config.ts
├── tsconfig.json
├── CLAUDE.md
└── .gitignore
```

### 多窗口入口分离

Tauri v2 支持多窗口，EchoWord 使用两个独立窗口：

- **主窗口**（`index.html` → `main.tsx`）：设置页、收藏列表、历史记录、引导页
- **弹窗窗口**（`popup.html` → `popup.tsx`）：翻译气泡，独立入口以减小弹窗加载体积

`tauri.conf.json` 中配置两个窗口：

```jsonc
{
  "app": {
    "windows": [
      {
        "label": "main",
        "title": "EchoWord",
        "url": "/",
        "width": 800,
        "height": 600,
        "visible": false  // 首次启动由引导流程控制
      },
      {
        "label": "popup",
        "url": "/popup.html",
        "width": 380,
        "height": 280,
        "decorations": false,
        "transparent": true,
        "alwaysOnTop": true,
        "visible": false,
        "skipTaskbar": true
      }
    ]
  }
}
```

---

## 3. 架构设计

### 3.1 整体分层

```
┌─────────────────────────────────────────────────┐
│                  前端 UI 层                      │
│  React + Tailwind + shadcn/ui + zustand         │
│  (弹窗窗口 / 主窗口)                             │
├─────────────────────────────────────────────────┤
│               Tauri IPC 层                       │
│  Commands（同步数据请求）                         │
│  Events（异步通知：快捷键/剪贴板/翻译完成）        │
├─────────────────────────────────────────────────┤
│               Rust 业务层                        │
│  翻译调度 / 缓存 / 音标谐音 / 命名拆分            │
├─────────────────────────────────────────────────┤
│               数据层 / 外部 API                   │
│  SQLite (rusqlite) / ECDICT / DeepL / 腾讯 / …  │
└─────────────────────────────────────────────────┘
```

### 3.2 窗口管理

| 窗口 | 用途 | 生命周期 |
|------|------|---------|
| 主窗口 `main` | 设置、收藏列表、历史记录 | 应用启动时创建，关闭时隐藏到托盘 |
| 弹窗窗口 `popup` | 翻译气泡 | 应用启动时创建并隐藏，翻译时定位并显示，关闭时隐藏 |
| 引导窗口 | 首次启动引导 | 复用主窗口，通过路由切换到引导页 |

弹窗窗口复用策略——不销毁重建，而是隐藏/显示 + 更新内容 + 重新定位，避免窗口创建开销。

### 3.3 IPC 通信模式

#### Commands（前端 → Rust，请求-响应）

```typescript
// 前端调用示例
const result = await invoke<TranslationResult>('translate', {
  text: 'ephemeral',
  mode: 'auto'
});
```

主要 Commands：

| Command | 参数 | 返回 | 说明 |
|---------|------|------|------|
| `translate` | `text`, `mode` | `TranslationResult` | 执行翻译 |
| `add_favorite` | `FavoriteItem` | `void` | 添加收藏 |
| `remove_favorite` | `word` | `void` | 取消收藏 |
| `get_favorites` | `query`, `page` | `FavoriteList` | 查询收藏列表 |
| `get_history` | `query`, `page` | `HistoryList` | 查询历史记录 |
| `get_settings` | — | `Settings` | 获取全部设置 |
| `update_setting` | `key`, `value` | `void` | 更新单项设置 |
| `check_accessibility` | — | `bool` | 检测辅助功能权限 |
| `open_accessibility_settings` | — | `void` | 打开系统权限设置 |
| `download_dictionary` | `version` | `void` | 下载扩展词典 |

#### Events（Rust → 前端，异步推送）

| 事件 | 载荷 | 说明 |
|------|------|------|
| `shortcut-triggered` | `{ text: string }` | 全局快捷键触发，携带剪贴板文本 |
| `clipboard-changed` | `{ text: string }` | 剪贴板监听模式下内容变化 |
| `show-popup` | `{ x, y, text }` | 通知弹窗窗口显示并定位 |
| `hide-popup` | — | 通知弹窗隐藏 |
| `translation-result` | `TranslationResult` | 异步翻译结果（AI 流式场景） |
| `dictionary-download-progress` | `{ progress: f64 }` | 词典下载进度 |

### 3.4 翻译流程

```
用户触发（快捷键/划词/输入/剪贴板）
    │
    ▼
  防抖（300ms 划词 / 500ms 输入）
    │
    ▼
  LRU 缓存检查 ──命中──▶ 直接返回结果
    │ 未命中
    ▼
  模式判断（单词 or 句子）
    │
    ├── 单词模式 ──▶ ECDICT 离线查询
    │                  │
    │                  ├── 命中 ──▶ 音标谐音处理 ──▶ 返回结果
    │                  └── 未命中 ──▶ 降级到在线 API
    │
    └── 句子模式 ──▶ 在线翻译源路由
                       │
                       ▼
                   降级链执行
                   DeepL → 腾讯 → 百度（用户可配置顺序）
                       │
                       ├── 成功 ──▶ 写入缓存 ──▶ 返回结果
                       └── 全部失败 ──▶ 返回错误提示
```

---

## 4. 数据库设计

### 4.1 数据库文件

- 路径：`{data_dir}/echoword/data.db`（`data_dir` 用户可配置，默认为系统应用数据目录）
- 模式：WAL（Write-Ahead Logging），减少锁冲突
- 离线词典单独文件：`resources/ecdict-core.db`（只读）

### 4.2 Schema

```sql
-- Migration 版本管理
CREATE TABLE schema_version (
    version     INTEGER PRIMARY KEY,
    applied_at  TEXT NOT NULL DEFAULT (datetime('now')),
    description TEXT
);

-- 收藏
CREATE TABLE favorites (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    word            TEXT NOT NULL,
    phonetic        TEXT,             -- 音标
    chinese_phonetic TEXT,            -- 中文谐音
    translation     TEXT NOT NULL,    -- 释义
    source_text     TEXT,             -- 原始查询文本（句子模式时存原句）
    created_at      TEXT NOT NULL DEFAULT (datetime('now')),
    review_count    INTEGER NOT NULL DEFAULT 0,
    UNIQUE(word)
);
CREATE INDEX idx_favorites_word ON favorites(word);
CREATE INDEX idx_favorites_created_at ON favorites(created_at);

-- 历史记录
CREATE TABLE history (
    id          INTEGER PRIMARY KEY AUTOINCREMENT,
    source_text TEXT NOT NULL,        -- 原文
    result_text TEXT NOT NULL,        -- 翻译结果
    mode        TEXT NOT NULL,        -- 'word' | 'sentence'
    provider    TEXT,                 -- 翻译源标识
    created_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
CREATE INDEX idx_history_created_at ON history(created_at);
CREATE INDEX idx_history_source_text ON history(source_text);

-- 设置（KV 存储）
CREATE TABLE settings (
    key         TEXT PRIMARY KEY,
    value       TEXT NOT NULL,        -- JSON 序列化值
    updated_at  TEXT NOT NULL DEFAULT (datetime('now'))
);
```

### 4.3 Settings KV 键清单

| Key | 值类型 | 默认值 | 说明 |
|-----|--------|--------|------|
| `shortcut_translate` | `string` | `"CmdOrCtrl+Shift+T"` | 翻译快捷键 |
| `shortcut_input` | `string` | `"CmdOrCtrl+Shift+I"` | 输入翻译快捷键 |
| `translation_provider` | `string` | `"ecdict"` | 默认翻译源 |
| `fallback_chain` | `string[]` | `["deepl","tencent","baidu"]` | 降级链顺序 |
| `api_keys` | `object` | `{}` | 各翻译源 API Key（加密存储） |
| `theme` | `string` | `"system"` | 主题：`light` / `dark` / `system` |
| `data_dir` | `string` | 系统默认 | 数据存储目录 |
| `privacy_mode` | `boolean` | `false` | 隐私模式 |
| `clipboard_listen` | `boolean` | `false` | 剪贴板监听 |
| `auto_update` | `boolean` | `true` | 自动更新 |
| `proxy` | `string` | `""` | 网络代理地址 |
| `http_api_port` | `number` | `16888` | 外部调用端口 |
| `onboarding_completed` | `boolean` | `false` | 引导完成状态 |
| `dictionary_version` | `string` | `"core"` | 当前词典版本 |
| `multi_engine_enabled` | `boolean` | `false` | 多引擎对照 |
| `multi_engine_list` | `string[]` | `[]` | 启用的对照引擎列表 |

### 4.4 Migration 机制

```rust
// 伪代码：应用启动时执行
fn run_migrations(conn: &Connection) -> Result<()> {
    let current_version = get_current_version(conn)?; // 查 schema_version 表
    let migrations = load_migration_scripts();          // 读 migrations/ 目录

    for migration in migrations.iter().filter(|m| m.version > current_version) {
        // 1. 备份数据库
        backup_database(&data_path, migration.version)?;

        // 2. 事务内执行迁移
        let tx = conn.transaction()?;
        tx.execute_batch(&migration.sql)?;
        tx.execute(
            "INSERT INTO schema_version (version, description) VALUES (?1, ?2)",
            params![migration.version, migration.description],
        )?;
        tx.commit()?;
        // 失败时自动回滚，不影响已有数据
    }
    Ok(())
}
```

执行策略：
1. 应用启动时检查 `schema_version` 表当前版本
2. 对比 `migrations/` 目录中的脚本版本
3. 按版本号升序执行未应用的迁移
4. 每次迁移前备份数据库文件（`data.db.bak.{version}`）
5. 迁移在事务中执行，失败自动回滚
6. 回滚后提示用户并记录日志

---

## 5. 核心模块设计

### 5.1 离线词典模块（`api/ecdict.rs`）

**ECDICT 数据库结构**（只读 SQLite）：

| 字段 | 说明 |
|------|------|
| `word` | 单词 |
| `phonetic` | 音标 |
| `definition` | 英文释义 |
| `translation` | 中文释义 |
| `pos` | 词性 |
| `tag` | 频率标签 |
| `exchange` | 词形变换 |

查询逻辑：
```rust
fn lookup(word: &str) -> Option<DictEntry> {
    // 1. 精确匹配（小写化后查询）
    // 2. 未命中 → 尝试词形还原（通过 exchange 字段反查）
    // 3. 仍未命中 → 返回 None，由调度层决定降级
}
```

**内置版本与扩展版本**：
- 核心版（5 万词）打包进 `resources/`，随应用分发
- 精简版（20 万词）和完整版（77 万词）从 GitHub Release 下载
- 下载后存放在用户数据目录，运行时优先使用扩展版

### 5.2 翻译源模块（`api/provider.rs`）

```rust
/// 统一翻译源接口
#[async_trait]
pub trait TranslationProvider: Send + Sync {
    /// 翻译源标识
    fn id(&self) -> &'static str;

    /// 翻译源名称
    fn name(&self) -> &'static str;

    /// 是否支持单词查询（含音标等详细信息）
    fn supports_word_lookup(&self) -> bool;

    /// 翻译
    async fn translate(&self, text: &str, from: &str, to: &str) -> Result<TranslationResult>;
}

/// 翻译结果
pub struct TranslationResult {
    pub source_text: String,
    pub translated_text: String,
    pub provider: String,
    pub mode: TranslationMode,       // Word | Sentence
    pub word_detail: Option<WordDetail>,
}

pub struct WordDetail {
    pub phonetic_us: Option<String>,  // 美式音标
    pub phonetic_uk: Option<String>,  // 英式音标
    pub chinese_phonetic: String,     // 中文谐音
    pub definitions: Vec<String>,     // 释义列表
    pub pos: Option<String>,          // 词性
}
```

各翻译源实现：

| 翻译源 | struct | 特点 |
|--------|--------|------|
| ECDICT | `EcdictProvider` | 离线查询，仅单词模式 |
| DeepL | `DeepLProvider` | 免费 50 万字符/月，翻译质量最佳 |
| 腾讯翻译 | `TencentProvider` | 免费 500 万字符/月 |
| 百度翻译 | `BaiduProvider` | 标准版免费，QPS=1 |
| 有道词典 | `YoudaoProvider` | 支持音标，适合单词备用 |
| OpenAI | `OpenAIProvider` | 支持流式，上下文理解好 |

### 5.3 缓存模块（`services/cache.rs`）

```rust
use lru::LruCache;
use std::num::NonZeroUsize;
use std::sync::Mutex;

pub struct TranslationCache {
    cache: Mutex<LruCache<String, TranslationResult>>,
}

impl TranslationCache {
    pub fn new() -> Self {
        Self {
            cache: Mutex::new(LruCache::new(NonZeroUsize::new(500).unwrap())),
        }
    }

    /// 生成缓存 key：provider + from + to + text
    fn cache_key(provider: &str, from: &str, to: &str, text: &str) -> String {
        format!("{}:{}:{}:{}", provider, from, to, text.to_lowercase())
    }

    pub fn get(&self, provider: &str, from: &str, to: &str, text: &str) -> Option<TranslationResult> {
        let key = Self::cache_key(provider, from, to, text);
        self.cache.lock().unwrap().get(&key).cloned()
    }

    pub fn put(&self, provider: &str, from: &str, to: &str, text: &str, result: TranslationResult) {
        let key = Self::cache_key(provider, from, to, text);
        self.cache.lock().unwrap().put(key, result);
    }
}
```

- 容量 500 条，内存缓存，重启清空
- 离线词典查询不走缓存（已足够快）
- 缓存 key 统一小写化，避免大小写差异导致的未命中

### 5.4 音标谐音模块（`services/phonetic.rs`）

**IPA → 中文映射表**（核心映射）：

```rust
/// 音素到中文谐音的映射
const IPA_MAP: &[(&str, &str)] = &[
    // 元音
    ("iː", "衣"),  ("ɪ", "一"),   ("e", "唉"),   ("æ", "哎"),
    ("ɑː", "阿"), ("ɒ", "奥"),   ("ɔː", "哦"),  ("ʊ", "乌"),
    ("uː", "乌"), ("ʌ", "啊"),   ("ɜː", "额"),  ("ə", "额"),
    // 双元音
    ("eɪ", "诶"),  ("aɪ", "爱"),  ("ɔɪ", "哦伊"), ("aʊ", "奥"),
    ("əʊ", "欧"),  ("ɪə", "一额"), ("eə", "唉额"), ("ʊə", "乌额"),
    // 辅音（可映射）
    ("p", "泼"),   ("b", "波"),   ("t", "特"),    ("d", "得"),
    ("k", "克"),   ("ɡ", "格"),   ("f", "夫"),    ("v", "夫"),
    ("s", "斯"),   ("z", "兹"),   ("m", "摸"),    ("n", "呢"),
    ("ŋ", "嗯"),   ("l", "了"),   ("r", "若"),    ("j", "一"),
    ("w", "乌"),   ("h", "喝"),
    // 辅音（不可直接映射，保留音标 + 提示）
    ("θ", "[θ咬舌送气]"),
    ("ð", "[ð咬舌浊音]"),
    ("ʃ", "时"),
    ("ʒ", "日"),
    ("tʃ", "吃"),
    ("dʒ", "吉"),
];
```

**处理流程**：

1. 解析 IPA 音标字符串，拆分为音素序列
2. 按音素长度降序匹配（优先匹配双音素）
3. 可映射音素 → 中文字
4. 不可映射音素 → 保留原始符号 + 发音提示
5. 用 `·` 连接所有音素的中文对应

```
输入: /ɪˈfemərəl/
处理: ɪ → 一, f → 夫, e → 唉, m → 摸, ə → 额, r → 若, ə → 额, l → 了
输出: 一 · 夫唉 · 摸 · 额 · 若 · 额 · 了
```

### 5.5 开发者命名拆分（`services/dev_name.rs`）

```rust
pub fn split_dev_name(input: &str) -> Option<Vec<String>> {
    if is_camel_case(input) {
        Some(split_camel_case(input))
    } else if is_snake_case(input) {
        Some(split_snake_case(input))
    } else if is_kebab_case(input) {
        Some(split_kebab_case(input))
    } else {
        None // 非开发者命名，不拆分
    }
}

fn is_camel_case(s: &str) -> bool {
    // 无空格、无下划线、无连字符，且包含大小写混合
    !s.contains(' ') && !s.contains('_') && !s.contains('-')
        && s.chars().any(|c| c.is_uppercase())
        && s.chars().any(|c| c.is_lowercase())
}

fn split_camel_case(s: &str) -> Vec<String> {
    // 在大写字母前插入分隔：getUserName → [get, User, Name]
    // 处理连续大写：parseHTTPResponse → [parse, HTTP, Response]
}
```

拆分后的单词列表依次查询词典，拼接释义返回。

### 5.6 外部 HTTP API（`http_server/`）

应用启动时在独立线程启动 HTTP 服务：

```rust
// 默认 127.0.0.1:16888，端口用户可配置
fn start_http_server(port: u16, app_handle: AppHandle) {
    std::thread::spawn(move || {
        let server = tiny_http::Server::http(format!("127.0.0.1:{}", port)).unwrap();
        for request in server.incoming_requests() {
            match (request.method(), request.url()) {
                (Method::Post, "/translate") => handle_translate(request, &app_handle),
                (Method::Get, "/selection_translate") => handle_selection(request, &app_handle),
                (Method::Get, "/input_translate") => handle_input(request, &app_handle),
                _ => request.respond(Response::from_string("Not Found").with_status_code(404)),
            }
        }
    });
}
```

- 仅监听 `127.0.0.1`，安全限制本机访问
- `/translate` POST body 为待翻译文本，返回 JSON 结果
- `/selection_translate` 触发划词翻译流程
- `/input_translate` 唤出输入翻译窗口

---

## 6. 前端架构

### 6.1 状态管理（zustand）

三个独立 store，职责分离：

```typescript
// translationStore.ts — 翻译状态
interface TranslationStore {
  result: TranslationResult | null;
  loading: boolean;
  error: string | null;
  mode: 'word' | 'sentence';
  translate: (text: string) => Promise<void>;
  switchMode: (mode: 'word' | 'sentence') => void;
  clear: () => void;
}

// settingsStore.ts — 设置状态（与 Rust 侧 settings 表同步）
interface SettingsStore {
  settings: Settings;
  loading: boolean;
  loadSettings: () => Promise<void>;
  updateSetting: (key: string, value: unknown) => Promise<void>;
}

// uiStore.ts — UI 状态
interface UIStore {
  popupVisible: boolean;
  currentPage: 'main' | 'onboarding';
  showPopup: () => void;
  hidePopup: () => void;
}
```

### 6.2 路由

主窗口使用 React Router：

```
/                    → 重定向到 /settings 或 /onboarding
/onboarding          → 引导页（首次启动）
/settings            → 设置页（默认 tab: 通用）
/settings/general    → 通用设置
/settings/translation → 翻译源设置
/settings/shortcut   → 快捷键设置
/settings/dictionary → 词典管理
/favorites           → 收藏列表
/history             → 历史记录
```

弹窗窗口无路由，直接渲染 `PopupWindow` 组件。

### 6.3 弹窗组件

```typescript
// PopupWindow.tsx
function PopupWindow() {
  const { result, loading, mode, switchMode } = useTranslationStore();

  // 监听 Tauri 事件
  useEffect(() => {
    const unlisten = listen('show-popup', (event) => {
      // 更新翻译状态，显示弹窗
    });
    return () => { unlisten.then(fn => fn()); };
  }, []);

  // 点击外部关闭
  useEffect(() => {
    const handleBlur = () => invoke('hide_popup');
    window.addEventListener('blur', handleBlur);
    return () => window.removeEventListener('blur', handleBlur);
  }, []);

  // Esc 关闭
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') invoke('hide_popup');
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="popup-container">
      {loading ? <Spinner /> : (
        mode === 'word'
          ? <WordResult data={result} />
          : <SentenceResult data={result} />
      )}
      <ModeSwitch mode={mode} onSwitch={switchMode} />
    </div>
  );
}
```

### 6.4 设置页面

使用 shadcn/ui 组件构建表单：

- `Input` — API Key 输入
- `Select` — 翻译源选择
- `Switch` — 开关类设置
- `Tabs` — 设置分类标签
- `Button` — 操作按钮
- `Card` — 词典管理卡片
- `Dialog` — 确认弹窗

### 6.5 引导页面

分步 Stepper 组件，共 5 步：

```
[1 欢迎] → [2 权限] → [3 翻译源] → [4 快捷键] → [5 完成]
```

- 每步可跳过
- 权限步骤调用 `check_accessibility` 检测权限状态，已授权则自动跳到下一步
- 引导完成后写入 `onboarding_completed = true`

### 6.6 主题

Tailwind CSS `darkMode: 'class'` 策略：

```typescript
// useTheme.ts
function useTheme() {
  const theme = useSettingsStore(s => s.settings.theme);

  useEffect(() => {
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      document.documentElement.classList.toggle('dark', mediaQuery.matches);
      const handler = (e: MediaQueryListEvent) => {
        document.documentElement.classList.toggle('dark', e.matches);
      };
      mediaQuery.addEventListener('change', handler);
      return () => mediaQuery.removeEventListener('change', handler);
    }
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);
}
```

---

## 7. 系统集成

### 7.1 全局快捷键

```rust
// Tauri v2 全局快捷键注册
app.handle().plugin(
    tauri_plugin_global_shortcut::Builder::new()
        .with_handler(move |app, shortcut, event| {
            if event.state == ShortcutState::Pressed {
                if shortcut == translate_shortcut {
                    // 1. 读取剪贴板
                    // 2. 发送 show-popup 事件
                    // 3. 触发翻译
                }
                if shortcut == input_shortcut {
                    // 唤出输入翻译窗口
                }
            }
        })
        .build(),
)?;
```

快捷键自定义：
- 用户在设置页修改快捷键 → 写入 settings 表 → 注销旧快捷键 → 注册新快捷键
- 检测快捷键冲突（系统级），冲突时提示用户

### 7.2 系统托盘

```rust
let tray = TrayIconBuilder::new()
    .icon(app.default_window_icon().unwrap().clone())
    .menu(&Menu::with_items(app, &[
        &MenuItem::new(app, "显示主窗口", true, None::<&str>)?,
        &CheckMenuItem::new(app, "隐私模式", true, false, None::<&str>)?,
        &PredefinedMenuItem::separator(app)?,
        &MenuItem::new(app, "设置", true, None::<&str>)?,
        &MenuItem::new(app, "退出", true, None::<&str>)?,
    ])?)
    .on_menu_event(|app, event| {
        match event.id().as_ref() {
            "显示主窗口" => { /* show main window */ },
            "隐私模式" => { /* toggle privacy mode */ },
            "设置" => { /* show settings */ },
            "退出" => { app.exit(0); },
            _ => {}
        }
    })
    .build(app)?;
```

### 7.3 剪贴板监听

P1 功能，后台定时轮询剪贴板：

```rust
fn start_clipboard_listener(app_handle: AppHandle) {
    tokio::spawn(async move {
        let mut last_content = String::new();
        loop {
            tokio::time::sleep(Duration::from_millis(500)).await;

            if !is_clipboard_listen_enabled(&app_handle) {
                continue;
            }

            if let Ok(current) = read_clipboard(&app_handle) {
                if current != last_content && !current.is_empty() {
                    last_content = current.clone();
                    app_handle.emit("clipboard-changed", &current).ok();
                }
            }
        }
    });
}
```

### 7.4 macOS 辅助功能权限

```rust
#[cfg(target_os = "macos")]
pub fn check_accessibility_permission() -> bool {
    // 调用 macOS API: AXIsProcessTrustedWithOptions
    use core_foundation::boolean::CFBoolean;
    use core_foundation::dictionary::CFDictionary;
    use core_foundation::string::CFString;

    let key = CFString::new("AXTrustedCheckOptionPrompt");
    let options = CFDictionary::from_CFType_pairs(&[(key, CFBoolean::false_value())]);

    unsafe {
        AXIsProcessTrustedWithOptions(options.as_concrete_TypeRef())
    }
}

#[cfg(target_os = "macos")]
pub fn open_accessibility_settings() {
    // 打开系统偏好设置 → 隐私 → 辅助功能
    std::process::Command::new("open")
        .arg("x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility")
        .spawn()
        .ok();
}
```

### 7.5 自动更新

`tauri.conf.json` 配置：

```jsonc
{
  "plugins": {
    "updater": {
      "endpoints": [
        "https://github.com/user/echo-word/releases/latest/download/latest.json"
      ],
      "pubkey": "YOUR_PUBLIC_KEY"
    }
  }
}
```

前端检查更新流程：
1. 应用启动时调用 `check()` 检测新版本
2. 检测到新版本 → 弹窗提示用户，显示版本号和更新内容
3. 用户确认 → 自动下载安装
4. 用户可选择"跳过此版本"或"稍后提醒"

---

## 8. 非功能性设计

### 8.1 API Key 加密存储

```rust
use ring::aead::{Aad, LessSafeKey, Nonce, UnboundKey, AES_256_GCM};
use ring::rand::{SecureRandom, SystemRandom};

/// 加密 API Key 后存入 settings 表
/// 密钥派生自机器唯一标识 + 应用标识，确保不同设备密钥不同
pub fn encrypt_api_key(key: &str) -> Result<String> {
    let rng = SystemRandom::new();
    let encryption_key = derive_machine_key()?;

    let unbound_key = UnboundKey::new(&AES_256_GCM, &encryption_key)?;
    let sealing_key = LessSafeKey::new(unbound_key);

    let mut nonce_bytes = [0u8; 12];
    rng.fill(&mut nonce_bytes)?;
    let nonce = Nonce::assume_unique_for_key(nonce_bytes);

    let mut in_out = key.as_bytes().to_vec();
    sealing_key.seal_in_place_append_tag(nonce, Aad::empty(), &mut in_out)?;

    // 返回 base64(nonce + ciphertext + tag)
    let mut result = nonce_bytes.to_vec();
    result.extend(in_out);
    Ok(base64::encode(&result))
}
```

### 8.2 请求防抖

前端实现，区分场景：

```typescript
// 划词翻译：300ms 防抖
const debouncedTranslate = useMemo(
  () => debounce((text: string) => translate(text), 300),
  []
);

// 输入翻译：500ms 防抖
const debouncedInputTranslate = useMemo(
  () => debounce((text: string) => translate(text), 500),
  []
);
```

### 8.3 网络代理

用户配置的代理传递给 `reqwest` 客户端：

```rust
fn build_http_client(proxy: &str) -> Result<reqwest::Client> {
    let mut builder = reqwest::Client::builder();
    if !proxy.is_empty() {
        builder = builder.proxy(reqwest::Proxy::all(proxy)?);
    }
    builder.timeout(Duration::from_secs(10)).build().map_err(Into::into)
}
```

支持 HTTP 和 SOCKS5 代理，`reqwest` 开启 `socks` feature 即可。

### 8.4 错误处理与降级

```rust
pub async fn translate_with_fallback(
    text: &str,
    providers: &[Box<dyn TranslationProvider>],
) -> Result<TranslationResult> {
    let mut last_error = None;

    for provider in providers {
        match provider.translate(text, "en", "zh").await {
            Ok(result) => return Ok(result),
            Err(e) => {
                log::warn!("Provider {} failed: {}", provider.id(), e);
                last_error = Some(e);
            }
        }
    }

    Err(last_error.unwrap_or_else(|| anyhow::anyhow!("No translation providers configured")))
}
```

降级策略：
- 超时（10s）→ 切下一个
- HTTP 错误（429 限频 / 401 鉴权失败 / 5xx）→ 切下一个
- 网络不可达 → 切下一个，全部失败时提示"网络不可用"
- 降级时在弹窗底部显示灰色提示文字

### 8.5 坚果云同步冲突处理

```rust
/// 启动时检测冲突文件
pub fn check_sync_conflicts(data_dir: &Path) -> Vec<PathBuf> {
    // 扫描数据目录，查找 "(NSConflict" 模式的文件
    std::fs::read_dir(data_dir)
        .into_iter()
        .flatten()
        .filter_map(|entry| entry.ok())
        .filter(|entry| {
            entry.file_name().to_string_lossy().contains("NSConflict")
        })
        .map(|entry| entry.path())
        .collect()
}
```

处理策略：
1. SQLite 使用 WAL 模式，减少写锁冲突
2. 启动时检测数据库锁定，重试 3 次（间隔 1s）
3. 检测到坚果云冲突文件时，在设置页面提示用户选择保留版本
4. 用户选择后删除冲突文件，避免累积

---

## 9. 构建与发布

### 9.1 CI/CD（GitHub Actions）

```yaml
# .github/workflows/release.yml
name: Release
on:
  push:
    tags: ['v*']

jobs:
  build:
    strategy:
      matrix:
        include:
          - platform: macos-latest
            target: aarch64-apple-darwin
          - platform: macos-latest
            target: x86_64-apple-darwin
          - platform: windows-latest
            target: x86_64-pc-windows-msvc

    runs-on: ${{ matrix.platform }}
    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: 20

      - name: Setup Rust
        uses: dtolnay/rust-toolchain@stable
        with:
          targets: ${{ matrix.target }}

      - name: Install dependencies
        run: npm ci

      - name: Build Tauri app
        uses: tauri-apps/tauri-action@v0
        env:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
          # macOS 签名
          APPLE_CERTIFICATE: ${{ secrets.APPLE_CERTIFICATE }}
          APPLE_CERTIFICATE_PASSWORD: ${{ secrets.APPLE_CERTIFICATE_PASSWORD }}
          APPLE_SIGNING_IDENTITY: ${{ secrets.APPLE_SIGNING_IDENTITY }}
          APPLE_ID: ${{ secrets.APPLE_ID }}
          APPLE_PASSWORD: ${{ secrets.APPLE_PASSWORD }}
          APPLE_TEAM_ID: ${{ secrets.APPLE_TEAM_ID }}
          # Tauri updater
          TAURI_SIGNING_PRIVATE_KEY: ${{ secrets.TAURI_SIGNING_PRIVATE_KEY }}
        with:
          tagName: v__VERSION__
          releaseName: 'EchoWord v__VERSION__'
          releaseBody: 'See the changelog for details.'
          releaseDraft: true
```

### 9.2 签名

| 平台 | 签名方式 | 说明 |
|------|---------|------|
| macOS | Apple Developer Certificate + Notarization | 需要 Apple Developer 账号（$99/年） |
| Windows | Windows Code Signing Certificate | 可选 EV 证书或 OV 证书 |

未签名的影响：
- macOS：Gatekeeper 阻止运行，用户需手动允许
- Windows：SmartScreen 警告

初期可先不签名，用户手动放行。后续申请证书再补。

### 9.3 更新分发

Tauri updater 通过 GitHub Release 分发：

1. CI 构建完成后，自动创建 GitHub Release
2. 上传安装包（`.dmg` / `.msi`）和更新包
3. 生成 `latest.json` 元数据文件（包含版本号、下载 URL、签名）
4. 应用启动时拉取 `latest.json` 对比版本号
5. 新版本可用时提示用户下载更新

`latest.json` 格式：
```json
{
  "version": "1.0.1",
  "notes": "Bug fixes and improvements",
  "pub_date": "2026-03-08T00:00:00Z",
  "platforms": {
    "darwin-aarch64": {
      "url": "https://github.com/.../EchoWord_1.0.1_aarch64.app.tar.gz",
      "signature": "..."
    },
    "darwin-x86_64": {
      "url": "https://github.com/.../EchoWord_1.0.1_x64.app.tar.gz",
      "signature": "..."
    },
    "windows-x86_64": {
      "url": "https://github.com/.../EchoWord_1.0.1_x64-setup.nsis.zip",
      "signature": "..."
    }
  }
}
```
