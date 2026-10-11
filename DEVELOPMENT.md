# 開発者向けガイド

利用者向けのダウンロード・操作手順は[README](README.md)に記載しています。

## 開発環境と起動

Node.js 24 LTSとnpmを使用します。初回の依存関係取得にはインターネット接続が必要です。

```sh
git clone https://github.com/WassanBorn72/reagent-preparation.git
cd reagent-preparation
npm ci
npm start
```

Electronの専用ウィンドウが開きます。ブラウザで開発する場合は、このフォルダーで次を実行します。

```sh
python3 -m http.server 8000 --bind 127.0.0.1
```

ブラウザで `http://127.0.0.1:8000` を開いてください。通常の利用ではサーバーは不要です。

## macOSの互換性

v1.1.3はElectron 43.7.9を使用し、macOS 12以降を対象としています。Electron 44以降はmacOS 13以降が必須です。アプリの `minimumSystemVersion` を変更するだけでは、Electron自体の最低OS要件を下げられません。

Macの配布ビルドでは `scripts/check-macos-minimum.py` がIntel・Apple Silicon両方のアプリ本体とElectron Frameworkの最低OS要件を検査します。Frameworkのplistに最低OS要件がない場合は、`otool` でMach-Oの情報を読み取ります。macOS 12.7.4での実機起動は未確認です。

依存関係を更新する際は、対応OSとセキュリティ更新の提供状況も確認してください。以前のv1.1.0・v1.1.1はElectron 44を使用しており、macOS 12では動作しません。

## テスト

計算ロジックのみのテストはNode.js 18以降で実行できます。デスクトップ版の開発・ビルドにはNode.js 24を使用してください。

```sh
node --test tests/*.test.js
```

テストは計7件です。計算テスト6件では、バッファー組成、単位換算、微量調製、ゼロ濃度、不正な入力や実現できない組成を検証します。デスクトップ操作のテスト1件では、APIを模擬してクリップボード・PDF保存・キャンセル・不正な呼び出しの拒否を検証します（実機の印刷ダイアログの確認とは別です）。

## 配布ビルド

対象OS上で実行します。出力先は `dist/` です。

| OS | コマンド | 配布形式 |
| --- | --- | --- |
| Windows x64 | `npm run build:win` | ポータブルEXE |
| macOS | `npm run build:mac` | Intel・Apple SiliconそれぞれのDMG |
| Linux x64 | `npm run build:linux` | AppImage |

**Actions → Build desktop applications → Run workflow** でも各OSの配布ファイルを作成できます。成功した実行のArtifactsから取得してください。このワークフローはReleaseを公開しません。Windows・Macが正式リリースの対象で、Linuxは開発用ビルドの対象です。

Windowsの発行元署名とMacのApple Developer ID署名・公証は未設定です。Mac版は `identity: "-"` と `hardenedRuntime: false` で明示的にアドホック署名します（発行元の証明にはなりません）。両CPU版を `codesign --verify --deep --strict` で検査し、CIと同じCPU版を新しいプロファイルで起動して初期レシピを計算します。CIにはダウンロード検疫がないため、このテストはGatekeeperの受け入れ確認ではありません。署名済み配布を行う場合は、必要な証明書・認証情報をGitHub Secretsで管理し、ビルド設定と利用者向け説明を更新してください。秘密情報をリポジトリに保存しないでください。

ビルド成功と実機での動作確認は別です。実機では起動、計算、ストックの保持、JSON保存・復元、表のコピー、印刷・PDF保存を確認してください。

## 正式リリース

`package.json` と `package-lock.json` のバージョンを揃え、READMEの直接ダウンロードURL・表示バージョンも更新し、`releases/vX.Y.Z.md` に変更内容を記載してコミットします。そのコミットに `vX.Y.Z` タグを付けてプッシュすると、**Release desktop applications** がWindows・Intel Mac・Apple Silicon Macの配布ファイルを作成します。テスト・全ビルド・ファイルの検証が成功した場合のみ、名前付きのオフラインブラウザ版ZIP、チェックサムとリリースノートを添えて正式Releaseを公開します。公開ジョブのみリポジトリへの書き込み権限を使用します。

失敗時はActionsのログを確認し、修正が必要なら次のバージョンでリリースしてください。一時的な失敗はタグを選んだ手動実行またはRe-runで再試行できます。既存Releaseの上書きは行いません。GitHubでActionsや組織ポリシーにより書き込みを制限している場合は、管理者による設定確認が必要です。

公開ジョブは一旦ドラフトとして配布ファイルをアップロードし、成功後に公開へ切り替えます。アップロード中の失敗でドラフトが残った場合も再実行は既存Releaseを上書きしないため、状況を確認して対処してください。

リリースのブラウザ版ZIPには利用者向けREADMEを含めます。公開済みタグのREADMEや同梱ファイルは、mainのドキュメント変更では更新されません。新版を配布する際に変更を取り込んでください。

## ファイル構成

| ファイル | 内容 |
| --- | --- |
| `index.html` | 日本語の入力・結果画面 |
| `style.css` | 画面・印刷のスタイル |
| `calculator.js` | 単位換算と希釈計算 |
| `app.js` | 画面操作、保存・復元、結果表示 |
| `tests/calculator.test.js` | 計算ロジックのテスト |
| `desktop/main.js` | ウィンドウ起動、クリップボード・PDF・印刷処理 |
| `desktop/preload.js` | 安全に限定したデスクトップ操作の橋渡し |
| `package.json` | デスクトップの起動・配布設定 |
| `.github/workflows/desktop-build.yml` | 各OSの配布用ビルド |
| `tests/desktop.test.js` | デスクトップAPIの模擬テスト |
| `scripts/check-macos-minimum.py` | Mac配布版の最低OS要件検査 |
| `.github/workflows/release.yml` | 正式リリースのビルド・公開 |
| `releases/` | バージョンごとのリリースノート |
| `DEVELOPMENT.md` | 開発者向けガイド |

## アイコン

薬品を混ぜるシンプルな透過アイコンを `build/icon.png`、`build/icon.ico`、`build/icon.icns` に配置します。画面とブラウザでは `assets/icon.png` を使用します。Electronの配布設定・ウィンドウ・HTMLの参照を揃え、ブラウザ版ZIPにもassetsを含めてください。
