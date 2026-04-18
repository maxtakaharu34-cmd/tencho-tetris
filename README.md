# てんちょーテトリス

カラフルなテトリス風ゲーム。4 ライン同時消しで「**てんちょーさん！**」と大きく表示されます。

- 単一 HTML / Vanilla JS / HTML Canvas / WebAudio
- ビルド不要・依存なし
- PC キーボード + スマホタッチ対応

## 遊ぶ

GitHub Pages 公開版（デプロイ後）:
<https://maxtakaharu34-cmd.github.io/tencho-tetris/>

ローカルで遊ぶ場合は `index.html` をブラウザで開くだけ。

## 操作

| キー | 動作 |
| --- | --- |
| ← / → | 左右移動 |
| ↓ | ソフトドロップ |
| Space | ハードドロップ |
| ↑ / X | 右回転 |
| Z | 左回転 |
| Shift / C | HOLD |
| P | ポーズ |
| R | リスタート（ゲームオーバー時）|

スマホは画面下のボタンで操作できます。

## ファイル構成

```
tencho-tetris/
├── index.html   # 画面・スタイル・タッチボタン
├── tetris.js    # ゲームロジック・演出・効果音
└── README.md
```

## ライセンス

MIT
