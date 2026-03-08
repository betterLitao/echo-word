# 开发周期 01：基础工程与应用骨架

## 周期目标

建立 EchoWord 的最小可运行桌面应用骨架，完成双窗口、数据库、设置、托盘、路由和基础 IPC，为后续翻译能力提供稳定底座。

## 本周期范围

### 必做功能

- 初始化 `Tauri v2 + React + TypeScript + Vite + Tailwind` 工程。
- 按技术设计建立主窗口与弹窗窗口双入口。
- 搭建 SQLite 连接、初始化 Migration 引擎和 `settings` 默认值。
- 完成主窗口路由骨架：`/onboarding`、`/settings`、`/favorites`、`/history` 占位页。
- 完成系统托盘常驻、主窗口显示/隐藏、弹窗显示/隐藏基础命令。
- 完成设置的读取、更新、持久化与前端状态同步。

### 目标模块

- 前端：`src/main.tsx`、`src/popup.tsx`、`src/stores/settingsStore.ts`、`src/stores/uiStore.ts`、`src/lib/tauri.ts`
- 前端页面：`src/components/settings/*`、`src/components/onboarding/*`、`src/components/popup/PopupWindow.tsx`
- Rust：`src-tauri/src/main.rs`、`src-tauri/src/lib.rs`、`src-tauri/src/commands/settings.rs`
- 数据层：`src-tauri/src/db/connection.rs`、`src-tauri/src/db/migration.rs`、`src-tauri/src/db/migrations/v001_init.sql`
- 配置：`src-tauri/tauri.conf.json`、`src-tauri/capabilities/default.json`

## 开发任务

### Rust 后端

- 建立 `db` 模块，封装数据库路径解析、连接创建、WAL 模式和连接复用。
- 实现 `schema_version`、`favorites`、`history`、`settings` 的初始化脚本。
- 实现 `get_settings`、`update_setting`、`check_accessibility`、`open_accessibility_settings` 命令骨架。
- 建立窗口控制辅助函数，支持 `show_popup`、`hide_popup`、`show_main_window`。
- 建立托盘菜单并接入“显示主窗口 / 设置 / 退出”动作。

### 前端 UI

- 初始化主窗口和弹窗窗口入口文件。
- 建立 `settingsStore` 与 `uiStore`，统一接管设置和 UI 可见性。
- 建立设置页和引导页的占位结构，不要求本周期填充全部业务逻辑。
- 建立弹窗外壳组件，先支持空态、加载态和基础容器样式。

### 集成与配置

- 按技术文档配置多窗口、应用图标、窗口默认可见性和尺寸。
- 约定基础错误日志输出方式，便于后续排查 IPC、数据库和窗口问题。
- 预留 `resources/` 目录和 ECDICT 资源加载路径，但本周期不做词典查询。

### 验证清单

- 应用可以通过开发命令正常启动。
- 首次启动会自动创建数据库和默认设置。
- 修改设置后，重启应用仍能正确读取。
- 托盘菜单可唤起主窗口并正常退出应用。
- 调试按钮或临时命令可以显示/隐藏弹窗窗口。

## 交付物

- 可运行的 EchoWord 工程骨架。
- 完整的数据库初始化与 Migration 基础能力。
- 基础设置系统与主/弹窗窗口壳层。
- 可作为后续周期开发基座的目录结构。

## 验收标准

- `main` 和 `popup` 两个窗口均可被创建并受控。
- `settings` 表默认键值完整，且更新后持久化成功。
- `schema_version` 能记录当前数据库版本。
- 托盘常驻、主窗口显示/隐藏、退出应用行为符合技术设计。

## 非本周期范围

- 离线词典查询
- 在线翻译 API
- 全局快捷键
- 自动划词弹窗
- 收藏/历史业务页面

## 风险与依赖

- 多窗口配置若在本周期没有打稳，后续弹窗交互会持续返工。
- 数据目录、数据库路径和权限相关代码需要从第一天开始保持跨平台兼容意识。
- `check_accessibility` 可以先保留 macOS 可用实现，Windows 侧先提供安全降级。

## 建议 PR 拆分

1. 工程初始化与 `tauri.conf.json` 多窗口配置
2. 数据库连接、Migration、默认设置
3. 主窗口路由、弹窗骨架与状态管理
4. 系统托盘与基础窗口控制命令
