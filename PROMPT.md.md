# AI 数独 Webアプリ 仕様書

## 目的
論理的思考を促すAIヒント解説機能付きの数独Webアプリを本番向けにリファクタリング・機能拡張する。

## 現状の構成
- 単一の `index.html`（HTML/Tailwind CSS/Vanilla JS、Lucide Icons、Canvas-confetti）
- クライアント側で推論（Naked Single, Hidden Single 等）を行う簡易AIエンジン内蔵

## 目指す構成
- Vite + TypeScript + React (or Vue) へのモダン化
- LLM API（Gemini API）連携による、より自然で柔軟な解説モードの追加
- PWA対応（オフライン・スマホホーム画面起動）
- 単体テストの導入（数独ソルバー、盤面生成ロジック）