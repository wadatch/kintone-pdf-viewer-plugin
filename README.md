# Kintone File Viewer Plugin

[![GitHub Workflow Status](https://img.shields.io/github/actions/workflow/status/wadatch/kintone-pdf-viewer-plugin/release.yml?branch=main)](https://github.com/wadatch/kintone-pdf-viewer-plugin/actions)
[![GitHub release (latest by date)](https://img.shields.io/github/v/release/wadatch/kintone-pdf-viewer-plugin)](https://github.com/wadatch/kintone-pdf-viewer-plugin/releases)
[![GitHub tag (latest by date)](https://img.shields.io/github/v/tag/wadatch/kintone-pdf-viewer-plugin)](https://github.com/wadatch/kintone-pdf-viewer-plugin/tags)

KintoneでPDFファイルとテキストファイルを直接表示するためのプラグインです。

## ダウンロード

最新のビルドファイルは[リリースページ](https://github.com/wadatch/kintone-pdf-viewer-plugin/releases)からダウンロードできます。

## インストール方法

1. リリースページから最新の`pdf-viewer-plugin.zip`をダウンロードします。
2. Kintoneの管理画面からプラグインをアップロードします。
   - 管理画面 > アプリ > プラグイン > プラグインの追加 > プラグインのアップロード
   - ダウンロードしたZIPファイルを選択

## 機能

### PDFファイル
- PDFファイルのクリック時にモーダルで表示
- ズームイン/アウト機能
- ページ情報の表示
- レスポンシブデザイン
- ページ送り機能
- PDFの回転機能
- ダウンロード機能

### テキストファイル
- テキストファイルのクリック時にモーダルで表示
- モノスペースフォントでの表示
- 自動改行対応
- ダウンロード機能

## 開発環境のセットアップ

### 必要条件

- Node.js (v14以上)
- npm (v6以上)
- Make

### インストール手順

1. リポジトリをクローンします
```bash
git clone [repository-url]
cd pdf-viewer-plugin
```

2. 依存パッケージをインストールします
```bash
npm install
```

## ビルド方法

### 通常のビルド

```bash
make build
```

ビルドされたプラグインは `dist/pdf-viewer-plugin.zip` に生成されます。

### 開発モード（ファイル監視）

ファイルの変更を監視して自動的にビルドを実行します：

```bash
npm run watch
```

## 使用方法

### PDFファイル
1. PDFファイルが添付されているフィールドのリンクをクリックします
2. モーダルウィンドウでPDFが表示されます
3. 以下の機能が利用可能です：
   - ズームボタンで表示サイズを調整
   - ページ送りボタンでページを移動
   - 回転ボタンでPDFを回転
   - ダウンロードボタンでPDFをダウンロード
   - ×ボタンでモーダルを閉じる

### テキストファイル
1. テキストファイルが添付されているフィールドのリンクをクリックします
2. モーダルウィンドウでテキストが表示されます
3. 以下の機能が利用可能です：
   - ダウンロードボタンでテキストファイルをダウンロード
   - ×ボタンでモーダルを閉じる

## 開発環境

- Kintone
- PDF.js
- JavaScript
- Node.js
- npm
- Make

## ライセンス

MIT License

## 作者

[Your Name]

## 注意事項

- このプラグインはKintoneの標準機能を拡張するものです
- プラグインの使用は自己責任でお願いします
- 問題や改善点があれば、Issueを作成してください 