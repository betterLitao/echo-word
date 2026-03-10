import { Lightning, Sparkle, Translate, X } from '@phosphor-icons/react'
import { listen } from '@tauri-apps/api/event'
import { useEffect, useRef, useState } from 'react'
import { isTauriRuntime, pushPopupResult } from '../../lib/tauri'
import { useTranslationStore } from '../../stores/translationStore'
import { Button } from '../ui/Button'
import { Field, fieldControlClassName } from '../ui/Field'
import { StatusPill } from '../ui/StatusPill'
import { ModeSwitch } from './ModeSwitch'

export function InputTranslateDialog() {
  const [open, setOpen] = useState(false)
  const [autoRun, setAutoRun] = useState(true)
  const textareaRef = useRef<HTMLTextAreaElement | null>(null)
  const input = useTranslationStore((state) => state.input)
  const result = useTranslationStore((state) => state.result)
  const loading = useTranslationStore((state) => state.loading)
  const error = useTranslationStore((state) => state.error)
  const mode = useTranslationStore((state) => state.mode)
  const resolvedMode = useTranslationStore((state) => state.resolvedMode)
  const statusNote = useTranslationStore((state) => state.statusNote)
  const providerHint = useTranslationStore((state) => state.providerHint)
  const setInput = useTranslationStore((state) => state.setInput)
  const setMode = useTranslationStore((state) => state.setMode)
  const primeInput = useTranslationStore((state) => state.primeInput)
  const translate = useTranslationStore((state) => state.translate)

  useEffect(() => {
    if (!isTauriRuntime()) {
      return
    }

    let unlisten: (() => void) | undefined
    void listen('input-translate-requested', () => {
      primeInput('')
      setOpen(true)
      window.setTimeout(() => textareaRef.current?.focus(), 50)
    }).then((fn) => {
      unlisten = fn
    })

    return () => unlisten?.()
  }, [primeInput])

  useEffect(() => {
    if (!open || !autoRun || !input.trim()) {
      return
    }

    const timer = window.setTimeout(() => {
      void translate(input, mode)
    }, 500)

    return () => window.clearTimeout(timer)
  }, [autoRun, input, mode, open, translate])

  useEffect(() => {
    if (!open) {
      return
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setOpen(false)
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [open])

  if (!open) {
    return null
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-slate-950/55 px-4 pb-4 pt-16 backdrop-blur-lg md:items-center" onMouseDown={(event) => {
      if (event.target === event.currentTarget) {
        setOpen(false)
      }
    }}>
      <section className="relative w-full max-w-3xl overflow-hidden rounded-[2rem] border border-white/10 bg-[linear-gradient(180deg,rgba(15,23,42,0.94),rgba(2,6,23,0.9))] p-6 shadow-[0_36px_90px_-42px_rgba(2,6,23,0.96)] backdrop-blur-2xl md:p-7">
        <div className="pointer-events-none absolute inset-px rounded-[1.9rem] border border-white/6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]" />
        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div>
            <div className="flex flex-wrap gap-2">
              <StatusPill icon={<Lightning size={14} weight="fill" />} label="输入翻译" tone="accent" />
              {resolvedMode ? <StatusPill icon={<Translate size={14} weight="duotone" />} label={resolvedMode === 'word' ? '单词' : '句子'} /> : null}
            </div>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-white md:text-[2.4rem] md:leading-[1.02]">快速输入翻译</h2>
            <p className="mt-4 max-w-[60ch] text-sm leading-8 text-slate-400">输入英文文本后自动翻译，也可以手动确认后发送到弹窗查看。</p>
          </div>
          <Button icon={<X size={16} weight="duotone" />} size="sm" variant="ghost" onClick={() => setOpen(false)}>关闭</Button>
        </div>

        <div className="relative mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.1fr)_320px]">
          <div className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <ModeSwitch value={mode} onChange={setMode} />
              <button className={`rounded-full border px-3 py-2 text-xs tracking-[0.12em] uppercase transition-colors ${autoRun ? 'border-emerald-300/18 bg-emerald-300/10 text-emerald-100' : 'border-white/10 bg-black/20 text-slate-400'}`} type="button" onClick={() => setAutoRun((current) => !current)}>
                自动翻译 {autoRun ? '开启' : '关闭'}
              </button>
            </div>

            <Field label="输入英文文本" description="支持单词和句子翻译，输入后自动识别。" errorText={error ?? undefined}>
              <textarea
                ref={textareaRef}
                className={`${fieldControlClassName} min-h-40 resize-none`}
                placeholder="例如 hello 或 We need a smoother workflow."
                value={input}
                onChange={(event) => setInput(event.target.value)}
              />
            </Field>

            <div className="flex flex-wrap gap-3">
              <Button icon={<Translate size={16} weight="duotone" />} variant="primary" disabled={loading} onClick={() => void translate()}>
                {loading ? '翻译中…' : '立即翻译'}
              </Button>
              <Button
                icon={<Sparkle size={16} weight="duotone" />}
                variant="secondary"
                disabled={!result}
                onClick={() => {
                  if (!result) {
                    return
                  }

                  void pushPopupResult(result).then(() => setOpen(false))
                }}
              >
                发送到弹窗
              </Button>
            </div>
          </div>

          <div className="rounded-[1.75rem] border border-white/10 bg-black/20 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)]">
            <p className="text-xs uppercase tracking-[0.24em] text-slate-500">翻译状态</p>
            <div className="mt-4 space-y-3 text-sm leading-7 text-slate-300">
              <p>{providerHint ?? '等待翻译'}</p>
              <p>{statusNote ?? '输入停止 500ms 后自动翻译'}</p>
            </div>
            <div className="mt-5 flex flex-wrap gap-2">
              <StatusPill icon={<Translate size={14} weight="duotone" />} label={mode === 'auto' ? '自动识别' : mode === 'word' ? '单词模式' : '句子模式'} tone="accent" />
              {result?.alternatives?.length ? <StatusPill icon={<Sparkle size={14} weight="duotone" />} label={`${result.alternatives.length + 1} 个引擎`} /> : null}
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}
