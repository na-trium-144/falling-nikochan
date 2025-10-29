## ver. 13.8 - 2025/10/29 [#819](https://github.com/na-trium-144/falling-nikochan/pull/819)

* オートプレイ中のキー・タップ判定を無効化

## ver. 13.7 - 2025/10/23 [#801](https://github.com/na-trium-144/falling-nikochan/pull/801)

* 現在のワークスペースの使い方がbun 1.3で動作しなくなったため、bun対応を諦めnpmワークスペースに移行

## ver. 13.6 - 2025/10/03 [#797](https://github.com/na-trium-144/falling-nikochan/pull/797)

* キャッシュがない状態でshareを開くと空ページになるバグを修正
* shareページのタイトルが「share.titleWithComposer」と表示される場合があるのを強制上書き

## ver. 13.4 - 2025/09/28 [#776](https://github.com/na-trium-144/falling-nikochan/pull/776)

* モバイル表示でも更新情報未読マークを追加

## ver. 13.3 - 2025/09/28 [#775](https://github.com/na-trium-144/falling-nikochan/pull/775)

* プレイ時に使用する時刻をyoutubeから取るのではなくperformance.now()基準にする

## ver. 13.1 - 2025/09/25 [#773](https://github.com/na-trium-144/falling-nikochan/pull/773)

* OpenAPIのAPI定義を追加
* queryパラメータなどのvalidation処理をhono-openapiのvalidatorと統合
* ScalarによるAPIドキュメントを追加

## ver. 13.0 - 2025/09/21 [#769](https://github.com/na-trium-144/falling-nikochan/pull/769),[#770](https://github.com/na-trium-144/falling-nikochan/pull/770), [#771](https://github.com/na-trium-144/falling-nikochan/pull/771), [#772](https://github.com/na-trium-144/falling-nikochan/pull/772)

* 編集画面にプレイ時と同様の音符のタップ音 & メトロノーム音を追加
* 編集画面のカーソル移動をYouTubeと同期しないようにすることで高速化
* パスワードをenterで送信可能に
* スライダーのUI (range input) のデザインを変更
* ドラッグ&ドロップで譜面ファイルを読み込めるようにした
* SpeedChangeにinterpパラメータを追加
* 共有タイトルに#fallingnikochanを含める
* result共有パラメータにplaybackRateを追加 & Date短縮
* ogResultの判定数表示を1の位中央揃えに変更

## ver. 12.53 - 2025/09/16 [#768](https://github.com/na-trium-144/falling-nikochan/pull/768)

* honoの bodyLimit ミドルウェアを使ってbodyを読まずにエラーを返す

## ver. 12.51 - 2025/09/14 [#764](https://github.com/na-trium-144/falling-nikochan/pull/764), [#766](https://github.com/na-trium-144/falling-nikochan/pull/766)

* cloudflare workersのcronで譜面の更新通知と人気の譜面リストをTwitterに投稿するようにした
    * gemini apiを使って不適切な投稿を除外
    * エラー時はdiscordのwebhookに通知

## ver. 12.49 - 2025/09/02 [#735](https://github.com/na-trium-144/falling-nikochan/pull/735)

* プレイ中のコンテキストメニューを無効化

## ver. 12.48 - 2025/08/18 [#733](https://github.com/na-trium-144/falling-nikochan/pull/733)

* ios無反応補正についてaboutの2ページに追記

## ver. 12.47 - 2025/08/18 [#734](https://github.com/na-trium-144/falling-nikochan/pull/734)

* ServiceWorkerが /og のパスを返す際30xリダイレクトを含むためエラーになっていたのを修正

## ver. 12.46 - 2025/08/04 [#732](https://github.com/na-trium-144/falling-nikochan/pull/732)

* localStorageを編集できるデバッグページ追加 (バージョン情報を7回クリックで表示)

## ver. 12.45 - 2025/07/30 [#720](https://github.com/na-trium-144/falling-nikochan/pull/720)

* clsx導入、classNameの記述を全置き換え

## ver. 12.44 - 2025/07/29 [#719](https://github.com/na-trium-144/falling-nikochan/pull/719)

* 新着譜面リストと検索結果のリストを無限スクロール可能にする

## ver. 12.42 - 2025/07/28 [#717](https://github.com/na-trium-144/falling-nikochan/pull/717)

* share→playを開く際に /play ではなく /locale/play を使うようにする (prefetchに失敗していたのを修正)
* そうするとdev環境限定inputDirectが要らないので削除
* 少しでもdiffを減らすためbuildCommitをポップアップchangeLogから消した

## ver. 12.41 - 2025/07/24 [#715](https://github.com/na-trium-144/falling-nikochan/pull/715)

* TWAで起動した際(`utm_source=nikochan.twa`) 一定条件で in app review を呼び出す機能を追加

## ver. 12.40 - 2025/07/23 [#714](https://github.com/na-trium-144/falling-nikochan/pull/714)

* manifestの1024アイコンをsvgに変更、apple-touch-iconは180に変更
* assets内のsvgをビルド時に小さくする
* iconとogTemplateはserviceWorkerのキャッシュから除外
* apple-touch-iconの角丸を削除
* pngquantでpngイメージを圧縮

## ver. 12.39 - 2025/07/22 [#712](https://github.com/na-trium-144/falling-nikochan/pull/712), [#713](https://github.com/na-trium-144/falling-nikochan/pull/713)

* accept-languageがja-JPの場合jaにフォールバックする処理を追加

## ver. 12.38 - 2025/07/14 [#707](https://github.com/na-trium-144/falling-nikochan/pull/707)

* アニメーション用の遅延setStateをカスタムフック(useDelayedDisplayState)にまとめた

## ver. 12.35 - 2025/07/12 [#704](https://github.com/na-trium-144/falling-nikochan/pull/704)

* PC表示でバージョン番号をクリックした際ページ遷移せずに更新履歴を表示するようにした

## ver. 12.34 - 2025/07/12 [#703](https://github.com/na-trium-144/falling-nikochan/pull/703)

* serviceworkerの更新時のステータスで
    * プログレスバーを表示するようにした
    * fetchのレスポンスではなくpostMessageで返すようにした
    * 表示処理をfooterからProviderに移動

## ver. 12.33 - 2025/07/12 [#659](https://github.com/na-trium-144/falling-nikochan/pull/659)

* プレイ結果を画像として保存・共有する機能の追加
* shareModalをsharePageModalに改名しカスタムフックでmodalコンポーネントを返すのではなくContext/Providerでの実装に変更
* shareInternalページのデータをsessionStorageではなくクエリ管理に変更

## ver. 12.32 - 2025/07/05 [#696](https://github.com/na-trium-144/falling-nikochan/pull/696)

* 譜面編集ヘルプの1ページ目に利用規約のリンクを追加 (GooglePlayのデベロッパープログラムポリシーに書いてあったので一応)

## ver. 12.30 - 2025/06/22 [#658](https://github.com/na-trium-144/falling-nikochan/pull/658)

* 再生開始位置と再生速度を変更するオプションを追加
* オプション画面のスクロールの挙動を修正

## ver. 12.28 - 2025/06/16 [#662](https://github.com/na-trium-144/falling-nikochan/pull/662)

* shareページのモバイルでのスクロール方法を変更
* YouTubeの読み込み前に動画サムネイル+Loading...を表示するようにした

## ver. 12.27 - 2025/06/15 [#660](https://github.com/na-trium-144/falling-nikochan/pull/660)

* editのラグを修正
    * changeLevelの結果を一旦即時反映
    * lua実行完了までに別の変更を加えた場合前の変更はキャンセル
    * コードの編集中にchartが変更されても編集中のコードを上書きしない

## ver. 12.26 - 2025/06/07 [#657](https://github.com/na-trium-144/falling-nikochan/pull/657)

* cloudflareがレスポンスを自動で圧縮するので、バックエンド側でsitemapをgzip圧縮しない

## ver. 12.25 - 2025/06/07 [#656](https://github.com/na-trium-144/falling-nikochan/pull/656)

* 大音符のボーナス点が入らなかった場合でもエフェクトが大音符を叩いた時のもの(2重particle)になっていたのを修正
* 大音符のbad判定では今までスコアを入れていなかったのにSEが鳴っていたのを、bad判定はmissにするようにした

## ver. 12.24 - 2025/06/06 [#655](https://github.com/na-trium-144/falling-nikochan/pull/655)

* miss判定の処理が必要以上の周期で呼ばれていたのを修正
    * miss判定をするループとオート判定をするループを別にした

## ver. 12.23 - 2025/06/06 [#653](https://github.com/na-trium-144/falling-nikochan/pull/653)

* Thru判定時に表示される音符の位置を判定を行った時刻(スルー後の位置)ではなく判定結果基準での位置に変更

## ver. 12.21 - 2025/06/06 [#651](https://github.com/na-trium-144/falling-nikochan/pull/651)

* iOSでSafariのバグにより起きる無反応を予測して補正する機能を追加 (「無反応補正」/「Thru判定」)
    * 指を離した時刻を保存しておき、その次のタップ時の判定の際 or 音符がmiss判定になる際に、前の指を離した時刻をタップとみなしたほうが実際の音符タイミングに近い場合はそのように判定する
* オプション画面のサイズが自動で調整され、スクロールできるようにした
* オートプレイの判定の挙動をプレイヤーと同じに変更
* 短い間隔で大音符が並んでいる際の判定を修正

## ver. 12.19 - 2025/05/30 [#638](https://github.com/na-trium-144/falling-nikochan/pull/638)

* テストプレイ中の記録は人気譜面リストの並び順に反映しない
    * 他の人のプレイ記録 の表示にはカウントする
* 1ユーザーが複数回同じ譜面をプレイした場合の回数を少なくカウントする(人気譜面リストの並び順 & 他の人のプレイ記録 として表示される数の両方)
    * 1回=1, 2回=1.5, 3回=1.83, 4回=2.08, 11回=3.02, 31回=4.02

## ver. 12.18 - 2025/05/29 [#628](https://github.com/na-trium-144/falling-nikochan/pull/628)

* プレイ記録共有時のパラメーターにキーボード操作かタッチ操作かの情報を追加
* 保存済みのベストスコアからプレイ記録の共有リンクを生成できるようにする
    * プレイ記録のパラメーターでdateがnullの状態・bigCountが存在しない(false)状態に対応
* ogp画像内のサムネイルの枠の色にlevelの色を反映する
* resultのogp画像でcomposerが空の時区切りのスラッシュが入っていたのを修正
* /og にcorsを追加
* chartListで表示するバッジの色をレベルの色に合わせるようにした & 未クリアの場合にもドットが表示されるようにした

## ver. 12.17 - 2025/05/28 [#636](https://github.com/na-trium-144/falling-nikochan/pull/636)

* cid 10xxxx を使用禁止にする

## ver. 12.16 - 2025/05/28 [#629](https://github.com/na-trium-144/falling-nikochan/pull/629)

* GitHub Actionによるprettierのcheckを導入

## ver. 12.15 - 2025/05/23 [#620](https://github.com/na-trium-144/falling-nikochan/pull/620)

* PC表示でも /main/latest などのページに戻るボタンを追加
* メインページのタブを現在開いているタブかどうかに関わらず常にクリック可能にした

## ver. 12.13 - 2025/05/20 [#604](https://github.com/na-trium-144/falling-nikochan/pull/604)

* productionのデプロイ先をVercelからCloudflareWorkerに変更

## ver. 12.12 - 2025/05/18 [#607](https://github.com/na-trium-144/falling-nikochan/pull/607)

* briefCacheをlocalStorageからcacheStorageに移す

## ver. 12.11 - 2025/05/18 [#606](https://github.com/na-trium-144/falling-nikochan/pull/606)

* ReactAceのsearchBoxを有効化
* モバイル表示で画面をスクロールするたびにReactAceの位置が更新されるようにする

## ver. 12.9 - 2025/05/17 [#593](https://github.com/na-trium-144/falling-nikochan/pull/593)

* 音符に100msフェードインと200msのフェードアウトを追加

## ver. 12.8 - 2025/05/17 [#593](https://github.com/na-trium-144/falling-nikochan/pull/593)

* /api/popular のdb呼び出しを効率化
* 譜面削除ボタン追加
* レベルの削除時にも確認を追加

## ver. 12.7 - 2025/05/10 [#574](https://github.com/na-trium-144/falling-nikochan/pull/574)

* browserslistをtailwindの対応バージョンに合わせる
* 対応ブラウザリストの表示を追加

## ver. 12.6 - 2025/05/10 [#573](https://github.com/na-trium-144/falling-nikochan/pull/573)

* i18n/ のindex.jsをdynamicとstaticとmdxに分けた
* core-jsを手動でimportせず、browserslistをもとにbabelに自動polyfillさせるよう設定
    * ver11.33で手動追加したpolyfillは削除
    * browserslistの設定はnext.jsの最低要件に合わせた
* audioContextがない環境でエラーを出さないようにした(動作確認できないけど)
* serviceworkerのcacheからttfを除外

## ver. 12.5 - 2025/05/09 [#572](https://github.com/na-trium-144/falling-nikochan/pull/572)

* 検索結果をバックエンドは全て返すようにし、フロントエンドは24件以上の場合もっと表示ボタンを表示

## ver. 12.2 - 2025/05/07 [#562](https://github.com/na-trium-144/falling-nikochan/pull/562), [#563](https://github.com/na-trium-144/falling-nikochan/pull/563)

* faviconをapp/からpublic/に移動
    * これのせいでhead内に favicon.ico が2つ書かれていたのを修正
* iconサイズとtypeの指定を修正・追加

## ver. 12.0 - 2025/05/06 [#560](https://github.com/na-trium-144/falling-nikochan/pull/560)

* YouTubeDataAPIで取得した動画情報を使った検索機能の実装

## ver. 11.35 - 2025/05/06 [#555](https://github.com/na-trium-144/falling-nikochan/pull/555)

* play中の画像アセットを音符1個ごとにfetchしないようbase64のdataURLに変更

## ver. 11.34 - 2025/05/05 [#553](https://github.com/na-trium-144/falling-nikochan/pull/553)

* sitemapの生成
* botのリクエストに対しては307リダイレクトの代わりに直接内容を返す

## ver. 11.33 - 2025/05/04 [#552](https://github.com/na-trium-144/falling-nikochan/pull/552)

* tsconfigのtargetとlibをes2021(frontendは2017)に統一し、polyfillを追加

## ver. 11.32 - 2025/05/04 [#541](https://github.com/na-trium-144/falling-nikochan/pull/541)

* すべてのページにdescriptionを追加
* パラメータなしの/editで/main/editにリダイレクトする

## ver. 11.31 - 2025/05/03 [#540](https://github.com/na-trium-144/falling-nikochan/pull/540)

* スパム対策でSVG化したメールアドレス表示を追加

## ver. 11.30 - 2025/05/03 [#534](https://github.com/na-trium-144/falling-nikochan/pull/534)

* アイコン変更, 音符画像を一部変更
* theme_colorとbackground_colorの指定を追加
* MacのPWAをフルスクリーンにするとstandaloneではなくフルスクリーン扱いになりプレイ画面が別タブで開いてしまうのを修正

## ver. 11.27 - 2025/05/02 [#530](https://github.com/na-trium-144/falling-nikochan/pull/530)

* 音符数表示をpcでは1の桁中央揃え、モバイルでは中央揃えに変更
* iPadサイズの画面で使用するもう1段階大きいタイトル表示を実装

## ver. 11.25 - 2025/05/02 [#529](https://github.com/na-trium-144/falling-nikochan/pull/529)

* pixi.js で描画するとsvgの画質が悪くなっていたため、ver11.23〜24をrevert

## ver. 11.23 - 2025/05/02 [#527](https://github.com/na-trium-144/falling-nikochan/pull/527)

* <del>playでの音符とエフェクトの描画をDOMで行うのをやめ、 pixi.js を使ってWebGLで描画するようにした</del>

## ver. 11.21 - 2025/04/28 [#522](https://github.com/na-trium-144/falling-nikochan/pull/522)

* cssのgradientが使えない環境で代わりの背景色を設定
* ipadのuserAgent認識を修正
* iosではYouTubeの音量を変更できないので、YouTube音量変更のinputを無効化

## ver. 11.19 - 2025/04/24 [#518](https://github.com/na-trium-144/falling-nikochan/pull/518)

* /main/play のサンプル譜面リストをSSRに変更

## ver. 11.18 - 2025/04/22 [#508](https://github.com/na-trium-144/falling-nikochan/pull/508)

* iOSでサービスワーカーが正常に機能していないのかasset_prefixへアクセスしようとする場合があったため、asset_prefixへのアクセスもサービスワーカーで処理するように変更

## ver. 11.15 - 2025/04/19 [#507](https://github.com/na-trium-144/falling-nikochan/pull/507)

* /api/latest や popular へのリクエストがエラーになったときstatusとmessageを表示する
* serviceWorkerがAPIへのfetchに失敗した場合502を返す
* /share が/api/briefへのアクセス中に発生したエラーステータスをそのまま返す

## ver. 11.13 - 2025/04/19 [#505](https://github.com/na-trium-144/falling-nikochan/pull/505)

* プレイ中の時間の計算にDateではなくperformance.now()を使う

## ver. 11.10 - 2025/04/19 [#503](https://github.com/na-trium-144/falling-nikochan/pull/503)

* play画面のフレームレートができるだけ一定になるように修正
* displayNoteの計算をrequestAnimationFrameではなくrender時に行う
* Revert #496

## ver. 11.9 - 2025/04/17 [#499](https://github.com/na-trium-144/falling-nikochan/pull/499)

* 非表示のレベルの編集では日付を更新しないようにする

## ver. 11.7 - 2025/04/16 [#496](https://github.com/na-trium-144/falling-nikochan/pull/496)

* <del>プレイ中にoutputLatencyの値が揺れるのを対策するため、latencyの最大値を使用する</del>

## ver. 11.6 - 2025/04/16 [#476](https://github.com/na-trium-144/falling-nikochan/pull/476)

* ベストスコアの保存をlvIndexではなくlvHashで管理するようにした
* chartListとレベル選択からクリア・フルコンボ状況がわかるバッジを追加

## ver. 11.5 - 2025/04/14 [#477](https://github.com/na-trium-144/falling-nikochan/pull/477)

* Big音符が1つも無いときBig音符数表示とresultのBigボーナス表示はグレーで表示するようにした

## ver. 11.0 - 2025/04/13 [#457](https://github.com/na-trium-144/falling-nikochan/pull/457)

* 動画の再生開始位置と再生終了位置の指定を追加
* copyBufferを譜面データに含める
* 編集ページにバージョン表記追加

## ver. 10.16 - 2025/04/07 [#456](https://github.com/na-trium-144/falling-nikochan/pull/456)

* @icon-park のimportをファイルごとに分けて行うようにした
    * dev環境の高速化

## ver. 10.13 - 2025/04/06 [#453](https://github.com/na-trium-144/falling-nikochan/pull/453)

* ChartListの表示を3列までにする
* ChartListでそれぞれの項目の背景色を追加 (Loading中のスケルトン表示と兼用)
* ChartListの表示時のアニメーションを削除

## ver. 10.12 - 2025/04/05 [#451](https://github.com/na-trium-144/falling-nikochan/pull/451)

* pwaでなくてもサービスワーカーを使うようにする
    * アップデート中のメッセージはpwaのときのみ表示する
* assetsの中でもhtmlとtxtだけはキャッシュから返す前に1回fetchするように変更
    * キャッシュされた古いバージョンのページが読み込まれる問題を心配する必要がない
        * アップデート後のリロードがいらなくなるので削除
    * 1秒のタイムアウトを設け、fetchできなければキャッシュから返す
    * /share は例外

## ver. 10.10 - 2025/04/03 [#446](https://github.com/na-trium-144/falling-nikochan/pull/446)

* ユーザー入力のタイミングで鳴らさないとaudioが有効にならないsafariの対策で、スタートボタンを押した時にSEを鳴らすようにした
* キーを長押ししたときの繰り返し入力を無視するようにした

## ver. 10.9 - 2025/04/03 [#445](https://github.com/na-trium-144/falling-nikochan/pull/445)

* プレイ中のフレームレートを制限するオプションを追加
    * デフォルトでは60fps以下になるようにした

## ver. 10.5 - 2025/04/02 [#430](https://github.com/na-trium-144/falling-nikochan/pull/430)

* モバイル表示時のUIをリニューアル
    * フッター追加
    * ページ階層の見直し
    * 譜面ID入力と最近プレイした譜面リストをトップページに移動

## ver. 10.4 - 2025/03/31 [#431](https://github.com/na-trium-144/falling-nikochan/pull/431)

* #369 (ver9.0) でshareページのbodyをSSRせずクライアント側でfetchする仕様に変更していたが、遅いのでmetaタグを利用してbriefデータを渡すようにした

## ver. 10.0 - 2025/03/30 [#403](https://github.com/na-trium-144/falling-nikochan/pull/403), [#424](https://github.com/na-trium-144/falling-nikochan/pull/424), [#426](https://github.com/na-trium-144/falling-nikochan/pull/426)

* 音符を叩いたときのSEを追加
    * baseLatency+outputLatencyの分だけ判定オフセットをずらす
    * safariではoutputLatencyが未実装だったので、あきらめる (デフォルトでSEオフ)
    * 3個以上とか同時に音符を叩いたときに鳴るSEの量を制限: 10msあたり通常1個+big1個までしか鳴らさない
* YouTubeとSEの音量調整ボタン追加
* ついでにそれ以外のUIも改善
    * pauseボタンを上部に追加
* 同一タブ内でYouTubeの初期化がうまくいかない問題が解決
* PWAとしてインストール可能にした
    * PWAの場合playやeditを同一のタブで開く
    * 編集中の譜面データが消失しないようにsessionStorageに退避
* PWAの場合のみserviceWorkerを起動
    * /のリダイレクト処理と、/api以外のルートのキャッシュをする
    * ASSET_PREFIXへのアクセスを元のドメインに書き換える
    * バージョン(/assets/buildVer.json)が更新されたときassetsを再度fetchする
    * languageDetectorもserviceWorker独自のものを実装

## ver. 9.18 - 2025/03/28 [#420](https://github.com/na-trium-144/falling-nikochan/pull/420)

* 譜面編集のluaExecをworkerで実行するようにし、workerをterminateするキャンセルボタンを実装

## ver. 9.17 - 2025/03/28 [#419](https://github.com/na-trium-144/falling-nikochan/pull/419)

* 音符間隔が狭い場合でもコンボ数とスコア表示のアニメーションがなめらかに動くようにした

## ver. 9.14 - 2025/03/26 [#416](https://github.com/na-trium-144/falling-nikochan/pull/416)

* ReactAceEditorで補完候補が表示されるようにした
* 譜面編集のタブ切り替えでコードエディタのカーソル位置がリセットされないようにした
* AceEditorのpositionをabsoluteにし、annotationとmarkerでエラー時の表示と、小節線とカーソル位置の表示を実装

## ver. 9.13 - 2025/03/21 [#400](https://github.com/na-trium-144/falling-nikochan/pull/400)

* shareリンクのパラメータ部分を薄い色で表示
* リンクをコピーした際タイトルを含めるようにした

## ver. 9.10 - 2025/03/21 [#395](https://github.com/na-trium-144/falling-nikochan/pull/395)

* /api/recordでプレイ回数だけでなくプレイ記録の統計を出力するようにした
* shareページのレベル選択のUIを書き直し、shareページとresult画面にプレイ統計のヒストグラムの表示を追加
* /api/popular と人気の譜面リストの表示を追加
* /main/play でmodalを閉じるときの動作のバグを修正
* published=trueのサンプル譜面はlatestに含まれないようにした
    * 既存のサンプル譜面はすべてpublished=trueにデータベースを書き換える (popularに表示されるようにするため)

## ver. 9.8 - 2025/03/15 [#384](https://github.com/na-trium-144/falling-nikochan/pull/383)

* ready画面からresult画面に戻れるようにした
* 画面が小さい時result表示をスクロールできるようにした
* ready画面とオプション画面にスライドインのアニメーションを追加

## ver. 9.7 - 2025/03/14 [#383](https://github.com/na-trium-144/falling-nikochan/pull/383)

* /og/shareのパラメーターにbriefを入れることでキャッシュできるようにする
* fetchStaticが環境変数のasset_prefixを使うようにする
* 環境変数の VERCEL_AUTOMATION_BYPASS_SECRET_PREVIEW_ONLY を VERCEL_PROTECTION_BYPASS_SECRET に変更し、Honoのbindingに入れる
* shareページのcanonicalURLがplaceholderのままになっていたのを修正

## ver. 9.6 - 2025/03/13 [#382](https://github.com/na-trium-144/falling-nikochan/pull/382)

* /share 以外のページにもOGP画像を追加

## ver. 9.5 - 2025/03/13 [#381](https://github.com/na-trium-144/falling-nikochan/pull/381)

* mdxを動的インポートし、localeの列挙を1箇所だけで済むようにした

## ver. 9.4 - 2025/03/12 [#379](https://github.com/na-trium-144/falling-nikochan/pull/379)

* slimeの動きをsvgアニメーションで作り直した
* だいぶ重くなるので、その代わりに以前のparticleとrippleを消しレンダリング負荷については解決
* 改めて軽量なparticleを静的なsvgで実装
* rippleが表示されていないバグを発見、修正 (いつから...?)
* play中に使う画像ファイルをスタート前にfetchしておくようにした
* スコア表示の雲を半透明に
* ニコチャンを1.2倍大きく
* musicAreaのレイアウトをちょっと変更

## ver. 9.3 - 2025/03/11 [#378](https://github.com/na-trium-144/falling-nikochan/pull/378)

* @fontsource/merriweather のバージョンを5.2.5にダウングレード、固定

## ver. 9.1 - 2025/03/11 [#377](https://github.com/na-trium-144/falling-nikochan/pull/377)

* URLにクエリパラメータでredirected=1がついているとき、リダイレクトに関するメッセージを表示する

## ver. 9.0 - 2025/03/11 [#369](https://github.com/na-trium-144/falling-nikochan/pull/369), [#370](https://github.com/na-trium-144/falling-nikochan/pull/370), [#365](https://github.com/na-trium-144/falling-nikochan/pull/365)

* valibotを導入し、Chart9のschema,validateChart()関数,apiのパラメータのパース処理をvalibotで書く
* データベースに平文パスワードを保存するのをやめる
  * route/src/api/chartFormat.ts のコメントを参照
  * 今までの /api/chartFile のAPIとの互換性はない
  * デプロイ時にデータベースの修正が必要
    * chartEntry.locale が必須 (nullを"jp"で埋める)
    * chartEntry.editPasswd → ChartFile.pServerHash & pRandomSalt
    * chartEntry.ip = []
* mongodbにアクセスする部分のTypeScript型指定を追加
* ChartBrief.playCountを廃止し、データベースにプレイ回数だけでなくスコアなども記録するPlayRecordを追加、 /api/record 追加
  * プレイごとにスコア、プレイ回数、FC回数、FB回数を記録。なにも識別しないで全部保存
  * todo: GETするAPIは作ったが、表示部分が未実装。それぞれのレベルのプレイ回数だけでなく、スコア分布・FC割合といった統計を表示できたらいいなと思っている(がそこまでデータが集まるかは不明)
* chartFileのpost時にもipアドレスを保存するようにした
* ドメインをutcodeに移行
    * キャッシュがうまく設定できないので `assets/` と `_next/` を再び別ドメインに分離
    * そうすると/share/のSSRページがjsを読めなくなる(assetsドメインのjsファイルを探しに行ってしまいバックエンドでの書き換えができない)ので、jsを書き換えてデータを埋め込むのではなくクライアントサイドでfetchすることにした
* apiが返すcache-controlヘッダーに`s-maxage`を追加 (環境変数`API_CACHE_EDGE`が設定されている場合)

## ver. 8.20 - 2025/03/09 [#367](https://github.com/na-trium-144/falling-nikochan/pull/367)

* wasmoonのwasmをassetsに入れてローカルでも使えるようにする

## ver. 8.18 - 2025/03/08 [#364](https://github.com/na-trium-144/falling-nikochan/pull/364)

* apiのテストを書いた `bun route:test`
* messagepackを返すAPIでContent-Typeを設定するようにした
* cidを受け取るAPIでcidが不正な場合400を返すようにした
* API_ENV とは別に /api/newChartFile のratelimitの有無を切り替える API_NO_RATELIMIT 環境変数を追加
* ciにテストの実行を追加、さらにjob間の依存関係を少し変更し効率化

## ver. 8.16 - 2025/03/06 [#356](https://github.com/na-trium-144/falling-nikochan/pull/356)

* play画面のloading表示の遷移、エラー表示処理を改善
* resultがすべて表示されるまでresetもexitもできないようにした
* エラーメッセージのi18n対応
* editのloadingとパスワード入力をmodal表示に変更
* editでテキスト入力中にshiftを押すとdragModeが変わってしまうバグを修正
* /main/playで譜面データを開いたときページタイトルも変わるようにした
* mainでの各Linkのprefetchを有効に戻した
    * 今はcloudflareのキャッシュを通しているので問題ない
    * 一応環境変数でオフのままにもできるようにもした

## ver. 8.15 - 2025/03/04 [#352](https://github.com/na-trium-144/falling-nikochan/pull/352)

* /main/playから/shareページへの遷移をmodal表示に変更
    * ブラウザのhistory遷移にも反応してmodalを開閉するようにした
* 新着譜面リストなどのExclusiveModeの処理にもhistory処理を統合

## ver. 8.13 - 2025/03/04 [#339](https://github.com/na-trium-144/falling-nikochan/pull/339)

* /og/:cid から /og/share/:cid へのリダイレクトを追加

## ver. 8.12 - 2025/03/03 [#332](https://github.com/na-trium-144/falling-nikochan/pull/332)

* playでresultの表示時にその結果を共有するリンクコピーボタン、共有ボタンを追加。
    * /share/cid?result=... のURLでresultを共有
    * タイトルとdescription, OGP画像(/og/result/cid?result=...)に結果を表示する
    * shareページに 共有された過去のプレイ結果 の表示が追加される
    * タイトルはクライアントサイドで通常のものに戻す
* /share/cid にクエリパラメーターのlangを追加。
    * headの内容(OGプレビューに使われる言語)はクエリパラメーターのlangに従って出力し、クエリパラメータとaccept-languageが一致していない場合はクライアントサイドでクエリパラメータを消したurlにリダイレクトする。
* shareページのheadに載せられているalternateのlocaleを削除
* og画像の生成が遅いので、コピーボタンor共有ボタンを押した段階で1回 /og に対してfetchを飛ばし、CDNサイドでキャッシュされるようにする

## ver. 8.11 - 2025/03/01 [#335](https://github.com/na-trium-144/falling-nikochan/pull/335)

* OGPに載せるサムネイルの周りに枠を追加
* ogのクエリパラメータに追加するため各workspaceにもversionを追加

## ver. 8.10 - 2025/02/28 [#331](https://github.com/na-trium-144/falling-nikochan/pull/331)

* WebShareAPIで共有するボタンをshareページ、editページのmetaタブに追加

## ver. 8.7 - 2025/02/28 [#309](https://github.com/na-trium-144/falling-nikochan/pull/309)

* @vercel/og を使ってshareリンク用のOGP画像を生成する
    * /og/:cid のパスで1200x630の画像を生成して返すようにした
* ttf形式でかつファイル名にハッシュが含まれないフォントファイルが必要になったため、
woffから変換してassets/以下に出力するスクリプト(woff2sfnt.js)を用意しビルド時に実行するようにした
* ついでに /share のパスのSSR処理を app.ts から別ファイルに分離
* tsconfigを route/ と app/ で分ける必要が生じたため、各ディレクトリにtsconfigを追加
* ついでに各ディレクトリにpackage.jsonも追加して、npmのworkspace機能で管理するように変更
    * chart/ のソースを編集するたびに `npm run t` または `bun t` の実行する必要があるが...

## ver. 8.5 - 2025/02/24 [#301](https://github.com/na-trium-144/falling-nikochan/pull/301)

* XSS対策のため /share ページで楽曲タイトルをエスケープする処理を追加

## ver. 8.4 - 2025/02/23 [#300](https://github.com/na-trium-144/falling-nikochan/pull/300)

* フォントをCDNから読み込むのではなく、npmでインストールしてバンドルするようにした

## ver. 8.3 - 2025/02/23 [#296](https://github.com/na-trium-144/falling-nikochan/pull/296)

* 負の速度を編集できないバグの修正
* vyまたはspeedが負のときの音符出現位置の計算を修正
* noteタブでもvyに負の値を指定可能に

## ver. 8.1 - 2025/02/22 [#293](https://github.com/na-trium-144/falling-nikochan/pull/293)

* bpmを変更してspeedも同時に変更される際にluaExecが2回連続で実行されてバグっていたのを修正

## ver. 8.0 - 2025/02/22 [#288](https://github.com/na-trium-144/falling-nikochan/pull/288),  [#291](https://github.com/na-trium-144/falling-nikochan/pull/291)

* chartデータver8
    * ローカル保存用のChartMinと編集用のChartEditに分割
    * editからローカル保存をした場合 Chart8Min 形式で保存され、譜面データはluaとしてしか記録されない
    *  譜面の編集時に毎回luaコードが実行される
    * /api/chartFile が扱うのは Chart8Edit (Luaと実行結果のChartの両方が含まれる)
* /api/seqFile を削除し、 /api/playFile が Level8Play または Level6Play を返す
* BPM看板の表示管理を改善
* BPM看板にSpeed変化の表示を実装
    * デフォルトでは非表示で、クエリパラメータ speed=1 でのみ表示される
* アップロードできる譜面サイズの制限をイベント数基準に変更
* validateChart() で未知のバージョンの譜面を変換しようとすると誤作動するのを修正
* バックエンドの例外処理をHTTPException使って書き直した
* POST /api/chartFile のレスポンスを200から204に変更

## ver. 7.17 - 2025/02/22 [#292](https://github.com/na-trium-144/falling-nikochan/pull/292)

* 譜面のhashが変わった場合と別にpublishedがtrueに変わった場合にも譜面の日時を更新するようにした

## ver. 7.16 - 2025/02/22 [#290](https://github.com/na-trium-144/falling-nikochan/pull/290)

* 譜面の難易度計算方法を変更: 5個以上同時押しする譜面でレベルが20に張り付くのを防止

## ver. 7.15 - 2025/02/21 [#289](https://github.com/na-trium-144/falling-nikochan/pull/289)

* slimeの画像を追加し(slime2.svg)、アニメーションするようにした

## ver. 7.14 - 2025/02/20 [#287](https://github.com/na-trium-144/falling-nikochan/pull/287)

* signatureの編集時にluaコードの違う行が変更されるバグを修正

## ver. 7.13 - 2025/02/19 [#283](https://github.com/na-trium-144/falling-nikochan/pull/283)

* BPM表示が4桁以上の場合も看板のサイズが変わらないようにした

## ver. 7.12 - 2025/02/18 [#276](https://github.com/na-trium-144/falling-nikochan/pull/276)

* プレイ中のBPM表示の切り替え処理のバグを修正

## ver. 7.11 - 2025/02/14 [#264](https://github.com/na-trium-144/falling-nikochan/pull/264)

* プレイ時の音源オフセット調整機能を追加
* 画面が小さいときプレイ時のオプションを別画面に
* ついでにcomposerが空の時区切りのスラッシュが表示されていたのを修正

## ver. 7.9 - 2025/02/13 [#262](https://github.com/na-trium-144/falling-nikochan/pull/262)

* originalCId/sampleCIdの定義をchartFormat/に移動
* dev環境でのみサンプル譜面枠にダミーのファイルが表示されるようにした

## ver. 7.8 - 2025/02/13 [#261](https://github.com/na-trium-144/falling-nikochan/pull/261)

* i18n ディレクトリを app/ 以下からルートに移動 (バックエンドからもアクセスできるようにするため)
* share/placeholder と edit ページのタイトルをi18nで管理するようにした
    * share/placeholder についてはcomposerの有無で2通りのみ (なので今までより条件分岐が減った)

## ver. 7.6 - 2025/02/12 [#253](https://github.com/na-trium-144/falling-nikochan/pull/253)

* トップページの譜面リストのレイアウトを改良
    * それぞれの譜面にYouTubeのサムネイル画像を追加
    * 新着譜面リストに譜面の日時(n分前)が表示されるようにした
    * リストではなくグリッド表示に変更し、ホバー時の背景色などを設定
    * 「すべて表示」ボタンでそれ以外の項目を非表示にするアニメーションを追加 (モバイル表示時以外)

## ver. 7.5 - 2025/02/12 [#256](https://github.com/na-trium-144/falling-nikochan/pull/256)

* プレイ中のchain数の表示色の仕様を変更
    * 従来のように100chain到達時に突然色が変わるのではなく、chain数に応じて徐々に色が変わる
    * Bad,Miss判定が1つでもある場合はchainによらず色が変わらない

## ver. 7.4 - 2025/02/12 [#255](https://github.com/na-trium-144/falling-nikochan/pull/255)

* ver7の譜面の1小節目の音符の表示位置が正しく計算されないバグを修正

## ver. 7.2 - 2025/02/11 [#245](https://github.com/na-trium-144/falling-nikochan/pull/245)

* 譜面を新規作成したときのパスワード周りの処理を修正

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
