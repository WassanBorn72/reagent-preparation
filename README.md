# 試薬作成計算ソフト

専用ウィンドウで使える、オフライン対応の希釈・組成計算アプリです。Electronを使用したデスクトップ版と、ブラウザで直接開く版があります。計算時にインターネット接続やアカウントは不要です。

開発リポジトリ： [WassanBorn72/reagent-preparation](https://github.com/WassanBorn72/reagent-preparation)

## 主な機能

- ストック試薬の名前・濃度を保存し、ワンクリックで組成に追加
- ストック一覧のJSONバックアップ・復元
- 複数のストック試薬から、目標の組成に必要な分注量を計算
- 溶媒の目安量を計算し、実現できない濃度や容量の超過を表示
- 同じ種類の濃度単位を換算し、最終容量はL・mL・µLで入力
- 入力のブラウザ自動保存、JSONファイルでの保存・復元
- 実験ノート向けの組成表のコピー・HTML出力・印刷・PDF保存
- 外部通信なしで動作

## 完成版のダウンロード

[Releases](https://github.com/WassanBorn72/reagent-preparation/releases) のAssetsから、Windowsは `.exe`、Intel Macは `macOS-x64.dmg`、Apple Silicon Macは `macOS-arm64.dmg` を取得してください。Node.jsの導入は不要です。配布ファイルのSHA-256は `SHA256SUMS.txt` に記載します。リリース処理中は、Actionsの成功後にファイルが表示されます。

### 配布ファイル名の見方

`Reagent-Preparation-Calculator` は「試薬作成計算ソフト」の識別名です。ファイル名でソフト・版・対象PCが分かるようにしています。

| v1.1.2のファイル名 | 対象 |
| --- | --- |
| `Reagent-Preparation-Calculator-v1.1.2-Windows-x64-Portable.exe` | Windows、インストール不要のポータブル版 |
| `Reagent-Preparation-Calculator-v1.1.2-macOS-x64.dmg` | Intel Mac |
| `Reagent-Preparation-Calculator-v1.1.2-macOS-arm64.dmg` | Apple Silicon Mac（Mシリーズ） |
| `Reagent-Preparation-Calculator-v1.1.2-Browser-Offline.zip` | オフラインブラウザ版（展開してindex.htmlを開く） |

GitHubの「Source code (zip / tar.gz)」は自動生成の開発用ソースです。この表示名は変更できません。通常の利用では上記の名前付きファイルを取得してください。

### macOSの対応バージョン

v1.1.2はmacOS 12（Monterey）以降を対象とし、Electron 43.7.9を使用しています。v1.1.0・v1.1.1はElectron 44を使用するためmacOS 13以降が必要で、12.7.4では起動できません。macOS 12を使用している方はv1.1.2以降の対応版を取得してください。Apple Siliconは `arm64.dmg`、Intel Macは `x64.dmg` を選択します。

配布ビルドではアプリ本体とElectron Frameworkの最低OS要件を確認します。macOS 12.7.4の実機起動は別途確認が必要です。

## デスクトップ版の起動

開発用の起動にはNode.js 24 LTSとnpmを使用します。初回の依存関係取得にはインターネット接続が必要です。

```sh
git clone https://github.com/WassanBorn72/reagent-preparation.git
cd reagent-preparation
npm ci
npm start
```

ブラウザのタブではなく、独立したアプリウィンドウが開きます。入力はアプリ専用の領域に保存され、ブラウザ版の保存内容とは別です。既存の入力はJSONファイルで移行できます。

### 配布ビルドの状況

ユーザーからGitHub Actionsのビルド成功が報告されています。最新版を利用する際は、更新後の `main` でActionsを再実行し、その実行のArtifactsを取得してください。ビルド成功と各PCでの実機動作確認は別です。

### 配布用アプリの作成

対象OS上で次のコマンドを実行してください。出力先は `dist/` です。

| OS | コマンド | 配布形式 |
| --- | --- | --- |
| Windows x64 | `npm run build:win` | ポータブル `.exe` |
| macOS | `npm run build:mac` | Intel・Apple Siliconそれぞれの `.dmg` |
| Linux x64 | `npm run build:linux` | `.AppImage` |

配布用アプリはNode.jsを内包するので、利用するPCへのNode.js導入は不要です。Windows版はexeを起動、macOS版はDMGからApplicationsへコピー、Linux版はAppImageに実行権限を付けて起動します。LinuxではFUSE等のOS側の依存関係が必要な場合があります。

GitHubの **Actions → Build desktop applications → Run workflow** でも各OSの配布ファイルを作成できます。成功した実行のArtifactsからダウンロードしてください。自動公開は行いません。現時点では署名・公証を設定していないため、OSによって発行元の警告が出る場合があります。公開配布する際には署名・公証を整備してください。

## ブラウザ版の起動

このフォルダーをPCにダウンロードし、展開して `index.html` をブラウザで開いてください。`app.js`、`calculator.js`、`style.css` は同じフォルダーに置いてください。

GitHubの **Code → Download ZIP** から取得できます。Gitを使う場合は以下を実行します。

```sh
git clone https://github.com/WassanBorn72/reagent-preparation.git
cd reagent-preparation
```

1. 最終容量と溶媒名を入力します。
2. 各ストック試薬の名前・濃度と、目標の最終濃度を入力します。
3. 「必要量を計算」を押すとストック量と溶媒の目安量が表示されます。

初期例は100 mLの50 mM Tris-HCl・150 mM NaClです。1 M Tris-HClを5 mL、5 M NaClを3 mL加え、精製水で100 mLに定容します。

入力はブラウザに自動保存します。ローカルファイルでの保存動作はブラウザによって異なるため、「入力をファイルに保存」でJSONに保存できます。別PCでは「保存した入力を開く」で復元します。計算結果は印刷ダイアログからPDF保存できます。

## ストック試薬を記録して追加

1. 「保存したストック試薬」で名前・濃度・単位を入力し、「ストックを登録」を押します。
2. 登録済み試薬の「＋ 名前（濃度）」をクリックすると、組成の行が追加されます。
3. 追加した行に最終濃度を入力して計算します。

同じ名前でも濃度や単位が異なるストックは別に登録できます。同じ名前・濃度・単位の重複登録は防ぎます。登録はアプリ／ブラウザの保存領域に保持されます。保存領域を消去すると一覧も失われるため、「ストック一覧を保存」でJSONバックアップしてください。「ストック一覧を開く」は既存一覧へ追加し、同じ登録は重複させません。最大200件です。調製レシピの入力JSONとストック一覧JSONは別のファイルです。

## 実験ノート用の組成表

計算後、試薬名・ストック濃度・最終濃度・添加量と、溶液名・最終容量を出力できます。

- **表をコピー**：HTMLの表とテキストをコピーします。Wordや表に対応した実験ノートに貼り付けてください。貼り付け先によってはテキストになります。
- **表をHTML保存**：表だけを独立したファイルとして保存します。ブラウザで開き、コピー・印刷できます。HTML中の試薬名等は文字として扱い、コードとして実行しません。
- **表を印刷**：入力画面やストック一覧を除いた、罫線付きのレシピを印刷します。実験ノートに貼れるよう印刷設定の倍率でサイズを調整してください。
- **PDF保存**：デスクトップ版では保存先を選択してPDFを書き出します。ブラウザ版では印刷画面から「PDFに保存」を選択してください。

コピー権限が得られないブラウザではHTML保存をご利用ください。表の溶媒量は目安なので、記載された最終容量に定容してください。

## 対応単位と制約

- モル濃度：M、mM、µM
- 質量濃度：mg/mL、g/L、µg/mL、% (w/v)
- 体積百分率：% (v/v)
- 倍率：×（10×ストックから1×を作る場合など）

同じ種類の単位のみ換算できます。分子量を必要とするモル濃度と質量濃度の変換、固体からの秤量、pH調整には対応していません。ストック量は C₁V₁ = C₂V₂ に基づきます。溶媒量は体積加算の近似なので、実際は溶媒で最終容量に定容してください。表示値は有効数字6桁です。混合順序や試薬の適合性・安全性を判定する機能はありません。

## 開発・検証

計算ロジックのみのテストはNode.js 18以降で実行できます。Electronの開発・ビルドには上記の環境を使用してください。

```sh
node --test tests/*.test.js
```

テストは計7件です。計算テスト6件では、バッファー組成、単位換算、微量調製、ゼロ濃度、不正な入力や実現できない組成を検証します。デスクトップ操作のテスト1件では、APIを模擬してクリップボード・PDF保存・キャンセル・不正な呼び出しの拒否を検証します（実機の印刷ダイアログの確認とは別です）。

HTTP配信する場合は、このフォルダーで `python3 -m http.server 8000 --bind 127.0.0.1` を実行できます。通常のPC利用ではサーバー起動は不要です。

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

## 正式リリースの作成（開発者向け）

`package.json` と `package-lock.json` のバージョンを揃え、`releases/vX.Y.Z.md` に変更内容を記載してコミットします。そのコミットに `vX.Y.Z` タグを付けてプッシュすると、**Release desktop applications** がWindows・Intel Mac・Apple Silicon Macの配布ファイルを作成します。テスト・全ビルド・ファイルの検証が成功した場合のみ、名前付きのオフラインブラウザ版ZIP、チェックサムとリリースノートを添えて正式Releaseを公開します。公開ジョブのみリポジトリへの書き込み権限を使用します。

失敗時はActionsのログを確認し、修正が必要なら次のバージョンでリリースしてください。一時的な失敗はタグを選んだ手動実行またはRe-runで再試行できます。既存Releaseの上書きは行いません。GitHubでActionsや組織ポリシーにより書き込みを制限している場合は、管理者による設定確認が必要です。
