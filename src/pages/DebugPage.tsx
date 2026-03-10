import { Bug, Database, MusicNote } from '@phosphor-icons/react'
import { invoke } from '@tauri-apps/api/core'
import { useState } from 'react'

interface EcdictResult {
  found: boolean
  word: string
  phonetic?: string
  translation?: string
  pos?: string
  exchange?: string
}

interface DictStats {
  path: string
  total_words: number
  size_bytes: number
  size_mb: string
}

export function DebugPage() {
  const [ecdictWord, setEcdictWord] = useState('hello')
  const [ecdictResult, setEcdictResult] = useState<EcdictResult | null>(null)
  const [ecdictLoading, setEcdictLoading] = useState(false)

  const [phoneticInput, setPhoneticInput] = useState('/həˈləʊ/')
  const [phoneticResult, setPhoneticResult] = useState<string | null>(null)
  const [phoneticLoading, setPhoneticLoading] = useState(false)

  const [dictStats, setDictStats] = useState<DictStats | null>(null)
  const [statsLoading, setStatsLoading] = useState(false)

  const handleEcdictLookup = async () => {
    setEcdictLoading(true)
    try {
      const result = await invoke<EcdictResult>('debug_ecdict_lookup', { word: ecdictWord })
      setEcdictResult(result)
    } catch (error) {
      console.error('ECDICT lookup failed:', error)
      setEcdictResult({ found: false, word: ecdictWord })
    } finally {
      setEcdictLoading(false)
    }
  }

  const handlePhoneticTest = async () => {
    setPhoneticLoading(true)
    try {
      const result = await invoke<string>('debug_phonetic_hint', { phonetic: phoneticInput })
      setPhoneticResult(result)
    } catch (error) {
      console.error('Phonetic hint failed:', error)
      setPhoneticResult('生成失败')
    } finally {
      setPhoneticLoading(false)
    }
  }

  const handleLoadStats = async () => {
    setStatsLoading(true)
    try {
      const result = await invoke<DictStats>('debug_dict_stats')
      setDictStats(result)
    } catch (error) {
      console.error('Load stats failed:', error)
    } finally {
      setStatsLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold text-slate-100">调试工具</h1>
        <p className="mt-1 text-sm text-slate-400">测试离线翻译功能</p>
      </div>

      {/* ECDICT 查询测试 */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 flex items-center gap-2 text-slate-200">
          <Bug size={20} weight="duotone" />
          <h2 className="text-lg font-medium">ECDICT 查询</h2>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={ecdictWord}
              onChange={(e) => setEcdictWord(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleEcdictLookup()}
              placeholder="输入单词..."
              className="flex-1 rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-emerald-300/30 focus:bg-white/[0.08]"
            />
            <button
              onClick={handleEcdictLookup}
              disabled={ecdictLoading}
              className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-6 py-2.5 text-sm font-medium text-emerald-100 transition-colors hover:border-emerald-300/30 hover:bg-emerald-300/15 disabled:opacity-50"
            >
              {ecdictLoading ? '查询中...' : '查询'}
            </button>
          </div>

          {ecdictResult && (
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              {ecdictResult.found ? (
                <div className="space-y-2 text-sm">
                  <div className="flex items-baseline gap-3">
                    <span className="font-medium text-slate-100">{ecdictResult.word}</span>
                    {ecdictResult.phonetic && (
                      <span className="text-slate-400">{ecdictResult.phonetic}</span>
                    )}
                    {ecdictResult.pos && (
                      <span className="rounded bg-white/10 px-2 py-0.5 text-xs text-slate-300">
                        {ecdictResult.pos}
                      </span>
                    )}
                  </div>
                  {ecdictResult.translation && (
                    <p className="text-slate-300">{ecdictResult.translation}</p>
                  )}
                  {ecdictResult.exchange && (
                    <p className="text-xs text-slate-500">变形: {ecdictResult.exchange}</p>
                  )}
                </div>
              ) : (
                <p className="text-sm text-slate-400">未找到单词: {ecdictResult.word}</p>
              )}
            </div>
          )}
        </div>
      </div>

      {/* 音标谐音测试 */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 flex items-center gap-2 text-slate-200">
          <MusicNote size={20} weight="duotone" />
          <h2 className="text-lg font-medium">音标谐音</h2>
        </div>

        <div className="space-y-4">
          <div className="flex gap-3">
            <input
              type="text"
              value={phoneticInput}
              onChange={(e) => setPhoneticInput(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handlePhoneticTest()}
              placeholder="输入 IPA 音标..."
              className="flex-1 rounded-lg border border-white/10 bg-white/[0.05] px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 outline-none transition-colors focus:border-emerald-300/30 focus:bg-white/[0.08]"
            />
            <button
              onClick={handlePhoneticTest}
              disabled={phoneticLoading}
              className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-6 py-2.5 text-sm font-medium text-emerald-100 transition-colors hover:border-emerald-300/30 hover:bg-emerald-300/15 disabled:opacity-50"
            >
              {phoneticLoading ? '生成中...' : '生成'}
            </button>
          </div>

          {phoneticResult && (
            <div className="rounded-lg border border-white/10 bg-black/20 p-4">
              <p className="text-lg text-slate-100">{phoneticResult}</p>
            </div>
          )}
        </div>
      </div>

      {/* 词典统计 */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <div className="mb-4 flex items-center gap-2 text-slate-200">
          <Database size={20} weight="duotone" />
          <h2 className="text-lg font-medium">词典统计</h2>
        </div>

        <button
          onClick={handleLoadStats}
          disabled={statsLoading}
          className="rounded-lg border border-emerald-300/20 bg-emerald-300/10 px-6 py-2.5 text-sm font-medium text-emerald-100 transition-colors hover:border-emerald-300/30 hover:bg-emerald-300/15 disabled:opacity-50"
        >
          {statsLoading ? '加载中...' : '加载统计'}
        </button>

        {dictStats && (
          <div className="mt-4 space-y-3 rounded-lg border border-white/10 bg-black/20 p-4 text-sm">
            <div className="flex justify-between">
              <span className="text-slate-400">路径</span>
              <span className="font-mono text-xs text-slate-300">{dictStats.path}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">总词数</span>
              <span className="font-medium text-slate-100">{dictStats.total_words.toLocaleString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-400">文件大小</span>
              <span className="font-medium text-slate-100">{dictStats.size_mb} MB</span>
            </div>
          </div>
        )}
      </div>

      {/* HTTP API 测试 */}
      <div className="rounded-xl border border-white/10 bg-white/[0.03] p-5">
        <h2 className="mb-4 text-lg font-medium text-slate-200">HTTP API 测试</h2>
        <div className="space-y-3 text-sm">
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <p className="mb-1 text-xs text-slate-500">查询单词</p>
            <code className="block overflow-x-auto text-xs text-slate-300">
              curl http://127.0.0.1:16888/debug/ecdict?word=hello
            </code>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <p className="mb-1 text-xs text-slate-500">词典统计</p>
            <code className="block overflow-x-auto text-xs text-slate-300">
              curl http://127.0.0.1:16888/debug/stats
            </code>
          </div>
          <div className="rounded-lg border border-white/10 bg-black/20 p-3">
            <p className="mb-1 text-xs text-slate-500">音标谐音</p>
            <code className="block overflow-x-auto text-xs text-slate-300">
              curl "http://127.0.0.1:16888/debug/phonetic?ipa=/θɪŋk/"
            </code>
          </div>
        </div>
      </div>
    </div>
  )
}
