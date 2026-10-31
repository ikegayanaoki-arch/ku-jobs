# 九州大学 就職先アーカイブ

ビルド不要の静的サイトです。`index.html` を直接開いても利用できます。

## GitHub Pages

このディレクトリの**中身**をGitHubリポジトリのルートに配置してください。
Settings → Pages → Deploy from a branch → main / (root) → Save で公開できます。

- index.html：画面
- style.css：スタイル
- app.js：絞り込み・合算・グラフ表示
- employment_data.js：整理した就職先データ
- .nojekyll：静的ファイルをそのまま配信
- tests/aggregation.cjs：動作チェック（`node tests/aggregation.cjs`）

PDF本体は含みません。「元PDF」は九州大学サイトのPDFに直接リンクします。
学部・学府を同時に複数選択でき、合算した掲載件数の降順で表示します。
年度・課程の選択は独立して保持します。掲載件数は就職者数ではありません。
2022年度は表示画像から転記した情報を含みます。表記は元PDFをご確認ください。

出典：https://www.kyushu-u.ac.jp/ja/education/employment/situation/place
公開にあたっては掲載元の転載条件をご確認ください。
