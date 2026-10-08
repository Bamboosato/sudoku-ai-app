import { useState } from 'react'
import type { GeminiAdviceState } from '../hooks/useGeminiAdvice'
import { HINT_LEVELS, HINT_LEVEL_LABELS, type HintLevel } from '../lib/gemini/types'

interface GeminiAdvisorProps {
  advice: GeminiAdviceState
  hasCustomApiKey: boolean
  onAsk: (level: HintLevel) => void
  onOpenSettings: () => void
}

export default function GeminiAdvisor({
  advice,
  hasCustomApiKey,
  onAsk,
  onOpenSettings,
}: GeminiAdvisorProps) {
  const [level, setLevel] = useState<HintLevel>(1)
  const loading = advice.status === 'loading'

  return (
    <div className="rounded-2xl p-4 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-sm">
      <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
        <h2 className="text-sm font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
          <i className="fa-solid fa-comments text-brand-500"></i> Gemini コーチ
        </h2>
        <button
          type="button"
          onClick={onOpenSettings}
          className="text-[10px] font-semibold px-2 py-0.5 rounded-full flex items-center gap-1 transition bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-500 dark:text-slate-400"
          title="クリックで API キー設定を開く"
        >
          <span className={`w-1.5 h-1.5 rounded-full ${hasCustomApiKey ? 'bg-emerald-500' : 'bg-slate-400'}`}></span>
          <span>{hasCustomApiKey ? 'キー設定済' : 'キー未設定'}</span>
        </button>
      </div>

      <div className="pt-3 grid grid-cols-4 gap-1 p-1 bg-slate-200/70 dark:bg-slate-800/70 rounded-xl text-[11px] font-semibold">
        {HINT_LEVELS.map((l) => (
          <button
            key={l}
            onClick={() => setLevel(l)}
            className={`px-1 py-1 rounded-lg transition ${
              l === level
                ? 'bg-white dark:bg-slate-900 text-brand-600 dark:text-brand-300 shadow-sm'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            {HINT_LEVEL_LABELS[l]}
          </button>
        ))}
      </div>

      <div className="py-3 text-xs leading-relaxed text-slate-600 dark:text-slate-300 min-h-[72px] flex flex-col justify-center">
        {advice.status === 'idle' && (
          <p className="text-center w-full">
            ヒントの強さを選んで相談すると、Gemini が盤面を見て段階的にアドバイスします。
          </p>
        )}
        {advice.status === 'loading' && (
          <p className="text-center w-full">
            <i className="fa-solid fa-spinner fa-spin mr-1.5"></i>盤面を考えています…
          </p>
        )}
        {advice.status === 'success' && (
          <p className="whitespace-pre-wrap">{advice.advice}</p>
        )}
        {advice.status === 'error' && (
          <div role="alert" className="text-rose-600 dark:text-rose-400 flex flex-col gap-1.5">
            <p>
              <i className="fa-solid fa-triangle-exclamation mr-1.5"></i>
              {advice.message}
            </p>
            {advice.message.includes('API') && (
              <button
                type="button"
                onClick={onOpenSettings}
                className="self-start text-[11px] font-semibold text-brand-600 dark:text-brand-400 underline hover:text-brand-700"
              >
                Gemini API キーを設定する →
              </button>
            )}
          </div>
        )}
      </div>

      <button
        onClick={() => onAsk(level)}
        disabled={loading}
        className="w-full py-2.5 px-3 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 font-semibold text-xs flex items-center justify-center gap-1.5 transition disabled:opacity-50 disabled:pointer-events-none"
      >
        <i className="fa-solid fa-wand-magic-sparkles text-brand-500"></i> Gemini に相談する
      </button>
    </div>
  )
}
