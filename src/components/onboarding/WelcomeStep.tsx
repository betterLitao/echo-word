export function WelcomeStep() {
  return (
    <div className="space-y-4">
      <p className="text-sm font-medium text-emerald-300">欢迎使用 EchoWord</p>
      <h2 className="text-3xl font-semibold text-white">一款面向开发者和阅读者的轻量级划词翻译工具</h2>
      <p className="max-w-3xl text-sm leading-7 text-slate-300">
        本周期先完成应用骨架、设置系统和窗口控制。后续周期会逐步接入离线词典、在线翻译、快捷键和自动划词弹窗。
      </p>
    </div>
  )
}
