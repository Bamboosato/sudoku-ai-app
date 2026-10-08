# Sudoku AI (スマート数独アシスタント)

Vite + React 19 + TypeScript + Tailwind CSS で構築された、Gemini AI 連携機能を備えた高機能・軽量な数独（ナンプレ）Webアプリケーションです。

---

## 🌟 主な機能

- **インタラクティブな数独ゲーム**
  - **100% 唯一解保証の盤面生成**: MRV（最小候補数優先）バックトラッキング探索による解数検証を行い、複数解のない厳密なパズルのみを生成（簡単 / 普通 / 難問の3難易度）。
  - **マス・関連要素のハイライト**: 選択マス、同一数字、関連する行・列・3x3ブロックを視覚的に強調。
  - **メモ機能（Pencil Notes）**: 各マス内に 1〜9 の候補数字を配置（手動トグル入力 & 全マス一括自動入力）。
  - **アクションツール**: Undo（元に戻す、最大30手）、消去、誤入力リセット（誤入力マスの一括消去 & ミスカウント、最大3ミスでゲームオーバー）。
  - **ナンパッド**: 1〜9 の各数字の「残り配置可能個数」をリアルタイムカウント表示。
  - **クリア演出**: クリア時の紙吹雪演出（canvas-confetti）と盤面ロック、タイム記録表示。
  - **テーマ & PWA**: ダークモード / ライトモード対応、PWA（Progressive Web App）によるオフライン完全動作。

- **デュアル・アシスタント機能**
  1. **ローカル論理ヒント（即時判定・完全無料）**
     - **誤入力最優先検知**: 盤面に誤入力がある場合、他のマスを案内する前に誤入力マスを最優先で特定・修正案内（正解数字は伏せてプレイヤーの思考をサポート）。
     - **ロジカル解法探索**: Naked Single（唯一候補マス）や Hidden Single（ブロック・行・列の隠れ一択）を自動検出し、論理的根拠をステップ解説。
  2. **Gemini AI コーチング（人間味のあるアドバイザー）**
     - `gemini-2.5-flash` モデルを活用した親切なコーチング。
     - **4段階のヒントレベル**:
       - レベル1: ノーヒント（考え方の方向性や誤入力の存在のみ）
       - レベル2: 着眼点（注目すべきブロックや行・列の範囲）
       - レベル3: マス特定（注目すべき具体的なマスと考える根拠）
       - レベル4: 直接回答（マスと正解数字を明示、誤入力時は保存済みの正解を提示）
     - **BYOK (Bring Your Own Key)**: 利用者が自身の Gemini API キーをブラウザ設定から安全に保存・即時反映。

---

## 🛠️ 技術スタック

- **フロントエンド**
  - [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
  - [Vite 8](https://vite.dev/) + [Vite PWA](https://vite-pwa-org.netlify.app/)
  - [Tailwind CSS v3](https://tailwindcss.com/)
  - [FontAwesome](https://fontawesome.com/)（アイコン）
  - [canvas-confetti](https://www.kirilv.com/canvas-confetti/)
- **バックエンド / API**
  - クライアント直接通信: Google Generative Language REST API (`directClient.ts`)
  - 開発用ミドルウェア: Vite dev server plugin (`server/vitePlugin.ts`) + [@google/genai SDK](https://github.com/google-gemini/generative-ai-js)
- **テスト**
  - [Vitest](https://vitest.dev/)（ユニットテスト、100問連続生成バッチテスト、プロンプト整合テスト）

---

## 🚀 セットアップと実行

### 1. リポジトリのクローンと依存関係のインストール

```bash
git clone https://github.com/Bamboosato/sudoku-ai-app.git
cd sudoku-ai-app
npm install
```

### 2. 環境変数の設定（任意）

利用者がブラウザ上の設定画面（⚙️アイコン）から**各自の Gemini API キーを入力して利用（BYOK: Bring Your Own Key）**できるため、環境変数の設定は**必須ではありません**。

ローカル開発やデプロイ先で全員共通のデフォルトキーを設定したい場合のみ、ルートディレクトリに `.env` ファイルを作成してください。

```bash
cp .env.example .env
```

`.env` の内容:
```env
GEMINI_API_KEY=your_gemini_api_key_here
```

> **Note**:
> - API キーが未設定でも、数独ゲーム本体およびローカル論理ヒント（Naked/Hidden Single、誤入力検知）は完全無料・制限なしでオフラインでも動作します。
> - Vercel 等にデプロイする際も、サーバーレス関数の設定や制限なしに、そのまま静的 SPA としてデプロイ可能です。

### 3. 開発サーバーの起動

```bash
npm run dev
```

起動後、ブラウザで [http://localhost:5173](http://localhost:5173) にアクセスしてください。

### 4. テストの実行

```bash
# 全ユニットテスト（コアロジック、唯一解検証、フック非同期制御、プロンプトテスト）を実行
npm test
```

### 5. ビルド・型チェック

```bash
# TypeScript 型チェック + 本番バンドルビルド
npm run build

# ビルド成果物のプレビュー
npm run preview
```

---

## 📁 ディレクトリ構成

```text
sudoku-ai-app/
├── docs/                      # 仕様書・設計書
│   ├── requirements.md        # 要件定義書
│   └── design.md              # システム設計書
├── server/                    # 開発時 API プロキシ / サーバー側 Gemini 連携
│   ├── geminiHint.ts          # プロンプト生成 & @google/genai 呼び出し
│   └── vitePlugin.ts          # Vite ミドルウェア (/api/hint)
├── src/
│   ├── components/            # UI コンポーネント
│   │   ├── ActionTools.tsx    # アクションボタン (Undo, 消去, メモ, 診断)
│   │   ├── ApiKeyModal.tsx    # API キー設定モーダル (BYOK)
│   │   ├── Board.tsx          # 9x9 数独盤面
│   │   ├── Cell.tsx           # セル（数字・メモ表示）
│   │   ├── DifficultyBar.tsx  # 難易度切り替えバー
│   │   ├── GeminiAdvisor.tsx  # Gemini AI アドバイザーパネル
│   │   ├── Header.tsx         # ヘッダー (タイマー, ミスカウンタ, 設定)
│   │   ├── HintPanel.tsx      # 論理ヒントパネル / 自動メモ / 解答展開
│   │   ├── Numpad.tsx         # 1〜9 ナンパッド（残り配置数バッジ付き）
│   │   ├── TechniqueInfo.tsx  # 解法テクニック解説ガイド
│   │   └── VictoryModal.tsx   # 勝利モーダル
│   ├── hooks/                 # カスタムフック
│   │   ├── useApiKey.ts       # API キー localStorage 管理
│   │   ├── useGeminiAdvice.ts # Gemini 通信ライフサイクル & 中止制御
│   │   ├── useSudokuGame.ts   # ゲームメインループ & キーバインド
│   │   ├── useTheme.ts        # テーマ (ダーク/ライト)
│   │   └── useTimer.ts        # タイマー計測
│   ├── lib/
│   │   ├── gemini/            # Gemini API 通信ライブラリ
│   │   │   ├── directClient.ts# REST API 直接通信
│   │   │   ├── hintClient.ts  # 通信ルーター
│   │   │   └── types.ts       # 型定義
│   │   └── sudoku/            # 数独コアロジック
│   │       ├── board.ts       # 盤面ユーティリティ
│   │       ├── gameReducer.ts # ゲーム状態遷移 (Reducer)
│   │       ├── generator.ts   # 唯一解保証パズル生成
│   │       ├── hints.ts       # 誤入力優先検知 & 論理ヒント探索
│   │       ├── solver.ts      # MRV バックトラッキング解法 & 解数カウント
│   │       └── types.ts       # 数独型定義 (PlacementHint / CorrectionHint)
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── tailwind.config.js
└── vite.config.ts
```

---

## 📚 ドキュメント

- [要件定義書 (`docs/requirements.md`)](./docs/requirements.md)
- [システム設計書 (`docs/design.md`)](./docs/design.md)

---

## 📄 ライセンス

MIT License
