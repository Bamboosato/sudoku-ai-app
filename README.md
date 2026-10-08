# Sudoku AI (スマート数独アシスタント)

Vite + React + TypeScript + Tailwind CSS で構築された、Gemini AI 連携機能を備えた高機能・軽量な数独（ナンプレ）Webアプリケーションです。

---

## 🌟 主な機能

- **インタラクティブな数独ゲーム**
  - 初級 / 普通 / 難問 の3段階の難易度
  - バックトラック法を用いた唯一解保証のランダム盤面自動生成
  - 選択マス・同一数字・関連する行/列/ブロックのハイライト表示
  - メモ機能（Pencil Notes）：セル内に 1〜9 の候補数字を配置（手動 & 一括自動入力）
  - Undo（元に戻す）、消去、ミス自動判定
  - ナンパッド各数字の残り配置可能個数カウント表示
  - ダークモード / ライトモード対応
  - クリア時の紙吹雪演出（canvas-confetti）

- **デュアル・アシスタント機能**
  1. **ローカル・ルールベース解析（即時判定）**
     - Naked Single（単一候補セル）や Hidden Single（ブロック内で一意の数字）を即座にロジカル検出
     - 盤面のハイライトと分かりやすい理由説明を表示
  2. **Gemini API 連携（人間味のあるアドバイザー）**
     - `gemini-2.5-flash` モデルを活用
     - 盤面の現在の状態（確定セル・メモ・ミス情報）をコンテキストとして送信
     - 初心者〜中級者向けに「どの行・列・ブロックに注目すべきか」を段階的かつフレンドリーにアドバイス

---

## 🛠️ 技術スタック

- **フロントエンド**
  - [React 19](https://react.dev/) + [TypeScript](https://www.typescriptlang.org/)
  - [Vite](https://vite.dev/)
  - [Tailwind CSS v3](https://tailwindcss.com/)
  - [FontAwesome](https://fontawesome.com/)（アイコン）
  - [canvas-confetti](https://www.kirilv.com/canvas-confetti/)
- **バックエンド / 開発サーバー API**
  - Vite dev server middleware プラグイン (`server/vitePlugin.ts`)
  - [@google/genai SDK](https://github.com/google-gemini/generative-ai-js) (`client.models.generateContent`)

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
> - API キーが未設定でも、数独ゲーム本体およびローカルルールベース解析（Naked/Hidden Single）は完全無料・制限なしで動作します。
> - Vercel にデプロイする際も、環境変数の設定なしでそのままデプロイして各ユーザーの API キーで使用可能です。

### 3. 開発サーバーの起動

```bash
npm run dev
```

起動後、ブラウザで [http://localhost:5173](http://localhost:5173) にアクセスしてください。

### 4. ビルド・型チェック

```bash
# TypeScript 型チェック + 本番ビルド
npm run build

# ビルド成果物のプレビュー
npm run preview
```

---

## 📁 ディレクトリ構成

```text
sudoku-ai-app/
├── server/                    # 開発時 API プロキシ / Gemini連携ロジック
│   ├── geminiHint.ts          # @google/genai を用いた Gemini プロンプト生成・API呼び出し
│   └── vitePlugin.ts          # Viteミドルウェア（POST /api/hint のルーティング）
├── src/
│   ├── components/            # UIコンポーネント
│   │   ├── Board.tsx          # 9x9 数独盤面
│   │   ├── Cell.tsx           # セル（数字・メモ表示）
│   │   ├── Numpad.tsx         # 1〜9 入力パレット（残り個数表示付き）
│   │   ├── GeminiAdvisor.tsx  # Gemini アドバイス表示パネル
│   │   ├── HintPanel.tsx      # ルールベースヒント / 自動メモ / ギブアップ
│   │   └── ...
│   ├── hooks/                 # カスタムフック (ゲーム状態、タイマー、Gemini、テーマ)
│   ├── lib/
│   │   ├── gemini/            # クライアント側 Gemini API 通信
│   │   └── sudoku/            # 数独コアロジック (生成、解法、バリデーション、ルールベースヒント)
│   ├── App.tsx
│   └── main.tsx
├── .env.example
├── tailwind.config.js
└── vite.config.ts
```

---

## 📄 ライセンス

MIT License
