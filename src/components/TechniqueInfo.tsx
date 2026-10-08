const TECHNIQUES = [
  { name: 'Naked Single (唯一候補)', desc: 'そのマスに入れる数字が1通りしかない状態。' },
  { name: 'Hidden Single (隠れ1択)', desc: '行・列・ブロック内でその数字が入れるマスが1つしかない状態。' },
  { name: 'Naked Pair (同盟ペア)', desc: '同じ2つの候補を持つマスが2つあり他を除外。' },
]

export default function TechniqueInfo() {
  return (
    <div className="rounded-2xl p-4 bg-white/70 dark:bg-slate-900/70 border border-slate-200/80 dark:border-slate-800/80 text-xs">
      <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-2 flex items-center gap-1.5">
        <i className="fa-solid fa-graduation-cap text-slate-400"></i> AIが検出する解法技法
      </h3>
      <ul className="space-y-1.5 text-slate-500 dark:text-slate-400 text-[11px]">
        {TECHNIQUES.map((t) => (
          <li key={t.name} className="flex items-start gap-1.5">
            <span className="text-brand-500 font-bold">•</span>
            <span>
              <strong>{t.name}</strong>: {t.desc}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
