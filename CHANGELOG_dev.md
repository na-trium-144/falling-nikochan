## ver. 7.1 - 2025/02/11 [#244](https://github.com/na-trium-144/falling-nikochan/pull/244)

* /api にmiddlewareが適用されないようにした

## ver. 7.0 - 2025/02/11 [#236](https://github.com/na-trium-144/falling-nikochan/pull/236), [#239](https://github.com/na-trium-144/falling-nikochan/pull/239), [#241](https://github.com/na-trium-144/falling-nikochan/pull/241), [#240](https://github.com/na-trium-144/falling-nikochan/pull/240)

* パスワード保存機能の改善
    * localStorageに保存されたhashだけではアクセスできないようにした (追加でsecure&httpOnlyのcookieがhashに含まれているものと合致していないといけない)
    * hashにcidを加え、同じパスワードでも別の譜面に同じhashを使いまわせないようにした
    * ver6以下の譜面データに限り、localStorageに保存されている旧仕様のパスワードハッシュ(pass-cid)でもアクセス可能で、次回アクセス時に削除され新しいパスワードハッシュ(ph-cid)に置き換えられる
    * パスワードを保存するかどうかをユーザーが選択できるようにした (preferSavePasswd としてlocalStorageに保存される)
* chartデータバージョン7
    * 音符の表示開始位置を上か下で選べるようにする
    * localeの情報を追加
    * ver6の譜面をeditで読み込むと、音符の表示開始位置はすべて下からに置き換えられる
        * Metaタブに警告が表示される
    * ver6の譜面をplayで読み込むと、ver6のコードを使って今までと同じように動作する
    * GET /api/chartFile はvalidateChart()をせずデータベースに保存されている譜面データ(ver5,6,7)をそのまま返すようにした
    * POST /api/chartFile は送られたchartデータのバージョン番号が古いとき自動的にアップグレードせず409を返すようにした
    * chartファイルのvalidationエラーで400ではなく415を返すようにした
    * /api/seqFile はChartSeqData6または7を返す
* i18n
    * next-intlを導入し、 /en と /ja を作成
    * chain→コンボ
    * version, policy, editGuide はmdxに移行
    * editGuideの文量を減らし、UI中に(WebCFaceからコピペした)ヘルプアイコンを入れた
* スコアとchainを右寄せではなく10の桁基準にした
* dev環境でのテスト用に /play に直接cid指定で飛べるようにした
* 最後に開いたバージョンを記録し、更新履歴ボタンに未読マークをつける
* nbuild時のeslintとtypeチェックを無効化

## ver. 6.26 - 2025/02/08 [#234](https://github.com/na-trium-144/falling-nikochan/pull/234)

* bun.lock追加、インストールとバックエンドの実行をbunでもできるようにした
* PRでlockfileを更新するCIを追加

## ver. 6.24 - 2025/02/04 [#233](https://github.com/na-trium-144/falling-nikochan/pull/233)

* /main/playから譜面を選択したとき違う譜面のページが表示されるバグを回避するため、/share/[cid].txt はapi側で書き換えず404のままにする

## ver. 6.22 - 2025/02/04 [#229](https://github.com/na-trium-144/falling-nikochan/pull/229)

* 404エラー時に404ページが表示されるようにした
* /share/cidのエラー時に返すerrorPlaceholderページを作成

## ver. 6.20 - 2025/02/03 [#221](https://github.com/na-trium-144/falling-nikochan/pull/221)

* メインページで、過去にfetchしたbriefデータをlocalStorageに保存しておいてfetchしている間それを表示するようにした

## ver. 6.17 - 2025/02/02 [#214](https://github.com/na-trium-144/falling-nikochan/pull/214)

* TailwindCSS4へ移行、CSSが崩れているところを一部修正

## ver. 6.16 - 2025/02/02 [#212](https://github.com/na-trium-144/falling-nikochan/pull/212)

* フロントエンドとバックエンドのコードを分離 
    * フロントエンド(app/ 以下)はNext.jsでstatic export
    * バックエンド(route/ 以下)はHonoを使用します

## ver. 6.13 - 2024/11/25 [#168](https://github.com/na-trium-144/falling-nikochan/pull/168)

* apiのレスポンスに cache-control を設定
* ページのforce-static指定

## ver. 6.12 - 2024/11/24 [#167](https://github.com/na-trium-144/falling-nikochan/pull/167)

* メインページでbriefをfetchしている間、UI上でbriefを表示する分のスペースを確保することで、fetch前と後で表示位置がずれないようにする

## ver. 6.11 - 2024/11/24 [#165](https://github.com/na-trium-144/falling-nikochan/pull/165)

* 譜面を一般公開する 機能を追加 / 「新着譜面」リストをトップページ (プレイする ページ) に追加しました
    * (これより前にアップロードされた譜面に関してはデフォルトで非公開状態になっています。)
    * 新しい順に25譜面まで表示されます。ぜひ気軽に投稿してみてください。

## ver. 6.10 - 2024/11/23 [#164](https://github.com/na-trium-144/falling-nikochan/pull/164)

* /main/play はrevalidateせずSSGにする

## ver. 6.9 - 2024/11/23 [#162](https://github.com/na-trium-144/falling-nikochan/pull/162)

* ダークテーマの色味を調整しました

## ver. 6.8 - 2024/11/21 [#161](https://github.com/na-trium-144/falling-nikochan/pull/161)

* assetPrefixを変更可能にし、public/ の中身を public/assets/ に移動
    * staticなファイルを別ドメイン(nikochan2.natrium144.org)にリダイレクトし、そっちはcloudflareでキャッシュさせることでvercelへのリクエストを減らす
* prefetchをすべてオフにする

## ver. 6.6 - 2024/11/19 [#158](https://github.com/na-trium-144/falling-nikochan/pull/158)

* playCountを更新する時にキャッシュをrevaildateしていなかったのを修正

## ver. 6.4 - 2024/11/19 [#155](https://github.com/na-trium-144/falling-nikochan/pull/155)

* revalidateをcidごとに

## ver. 6.3 - 2024/11/19 [#149](https://github.com/na-trium-144/falling-nikochan/pull/149)

* briefの取得をunstable_cacheに入れる
* aboutページをSSR

## ver. 6.2 - 2024/11/17 [#148](https://github.com/na-trium-144/falling-nikochan/pull/148)

* 100vhを100dvhに変更

## ver. 6.1 - 2024/11/17 [#145](https://github.com/na-trium-144/falling-nikochan/pull/145)

* 譜面編集でローカルに保存するファイルの形式をymlに変更

## ver. 6.0 - 2024/11/17 [#143](https://github.com/na-trium-144/falling-nikochan/pull/143)

* サーバーをVercelに、データベースをMongoDBに移転

## ver. 5.28 - 2024/11/15 [#144](https://github.com/na-trium-144/falling-nikochan/pull/144)

* サーバーにアップロードした譜面の中で一部のレベルを非公開にする機能を追加
    * 譜面編集画面の Level タブでレベルを選択して「このレベルを非表示にする」にチェックを入れると、譜面の共有画面に表示されなくなります

## ver. 5.27 - 2024/11/12 [#141](https://github.com/na-trium-144/falling-nikochan/pull/141)

* リザルト画面のメッセージを表示するスコアの基準を修正

## ver. 5.26 - 2024/11/12 [#135](https://github.com/na-trium-144/falling-nikochan/pull/135)

* リザルト画面の表示を改良
    * FullChain,PerfectChainなどのメッセージと、それ以外のときにもメッセージを表示するようにした

## ver. 5.25 - 2024/11/10 [#134](https://github.com/na-trium-144/falling-nikochan/pull/134)

* ニコチャンを叩いたときにparticleとrippleを表示する
    * blurを入れたかったがiOSでだいぶ重くなったのでやめた
* その代わりニコちゃんの右上に表示していたスコア倍率表示を消した
* setIntervalをrequestAnimationFrameに変更
* fps表示復活 (隠し機能として、プレイ画面のurlに `&fps=` を追加すると表示されます)
* プレイ画面のタイトルを消した (share画面と区別がつかなかったので)

## ver. 5.24 - 2024/11/09 [#132](https://github.com/na-trium-144/falling-nikochan/pull/132)

* iOSでID入力して譜面編集画面が開かないので、ID入力後に開くボタンが表示されるようにした
* 編集画面を開いて最初は「パスワードが間違っています」を表示しないようにした
* dev環境でのみパスワードのチェックをスキップするようにした (iOSがhttpでcryptoを使えないので)

## ver. 5.22 - 2024/11/09 [#129](https://github.com/na-trium-144/falling-nikochan/pull/129)

* ダークテーマを実装しました。メニュー等のページで右下の Theme ボタンから切り替えられます。
* プレイ画面と編集画面が常に新しいタブで開くようにしました

## ver. 5.20 - 2024/11/06 [#127](https://github.com/na-trium-144/falling-nikochan/pull/127)

* スタートボタンを2回押さないと始まらないことがあるバグを修正 #127

## ver. 5.19 - 2024/11/05 [#126](https://github.com/na-trium-144/falling-nikochan/pull/126)

* プレイ中のYouTube動画が最後まで再生された場合に再度自動再生してしまうバグを修正

## ver. 5.17 - 2024/11/05 [#124](https://github.com/na-trium-144/falling-nikochan/pull/124)

* 譜面編集画面の改善
    * 1/30秒送りボタンを追加し、操作ボタンの並び順を変更しました
    * 1小節送りボタンのキーをshift+左右キーではなくPageUp/PageDownに変更
    * タッチ操作時、画面上の音符を触ると位置が動かせる機能をオン/オフ切り替えるボタンを追加、その他操作性改善

## ver. 5.16 - 2024/11/02 [#121](https://github.com/na-trium-144/falling-nikochan/pull/121)

* Next.js 15 & ESLint9 に移行

## ver. 5.15 - 2024/11/02 [#120](https://github.com/na-trium-144/falling-nikochan/pull/120)

* 最近プレイした譜面 / 最近編集した譜面のリストの表示を改良
    * 最後にプレイしたものが一番上に来るようにしました
    * 最初の5つのみを表示し、「すべて表示」ボタンを押すことで残りを表示するようにしました

## ver. 5.14 - 2024/10/31 [#119](https://github.com/na-trium-144/falling-nikochan/pull/119)

* プレイ中に再生時間の表示を追加
    * 編集画面のMetaタブのファイルサイズ表示のバーと共通化し、ProgressBarコンポーネントとして分離
* 開発者モードでタイトル表示にスクロールバーが表示されるのを修正

## ver. 5.13 - 2024/10/30 [#118](https://github.com/na-trium-144/falling-nikochan/pull/118)

* プレイ中の画面にもバージョン表記を追加

## ver. 5.12 - 2024/10/30 [#114](https://github.com/na-trium-144/falling-nikochan/pull/114)

* バージョン番号の表記を追加
    * 拍子変化を実装 (#80) をver5.0として、PRごとにminorバージョンを上げる
    * dependabotや、update README.md はカウントしないことにすると、 #107 がver5.11、これがver5.12になるはず
* 外部リンクのアイコン表示とスタイルの設定をExternalLinkコンポーネントに分離
