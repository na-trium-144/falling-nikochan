import { rateLimitMin } from "@/../chartFormat/apiConfig.js";
import { chartMaxSize } from "@/../chartFormat/chart.js";

export function GuideContent2() {
  return (
    <>
      <li>
        テストプレイ:
        ブラウザーの新しいタブで現在の譜面をプレイする画面が開きます。
        オートプレイを見ることも自分でプレイすることもできます。
      </li>
      <li>
        サーバーに保存: 現在の譜面をサーバーに保存します。
        まだ1度も保存していない新規譜面の場合、保存することでランダムな6桁の譜面IDが割り振られます。
        <br />
        新しくサーバーに譜面を保存するのは{rateLimitMin}
        分ごとに1回までに制限しています。
        (1度保存した譜面の上書きは何回でもできます。)
        <br />
        またアップロードできる譜面データのサイズは {chartMaxSize / 1000} kB
        までです。
      </li>
      <li>
        ローカルに保存・読み込み:
        現在の譜面をダウンロードして保存することができます。 Falling Nikochan
        のサーバーはあまり信用ならないので、
        サーバーに保存するだけでなく各自でコピーを残しておくことをおすすめします。
        <br />
        また製作途中の譜面などをサーバーに送らず一時保存するのにも使えます。
        <br />
        ローカルに保存したファイルには編集用パスワードはかかっていません。
      </li>
      <li>
        YouTube URL または動画ID: 譜面で使用する楽曲を指定してください。
        入力した動画が左上の枠内に表示されます。
      </li>
      <li>
        楽曲情報: 楽曲タイトル、作曲者、譜面製作者などの情報を入力できます。
      </li>
      <li>
        編集用パスワード:
        次回からこの譜面を編集する際に必要なパスワードを設定することができます。
        これを設定しないと、譜面IDを知っている人が誰でもこの譜面を編集できてしまいます。
        <br />
        パスワードはこのブラウザの Local Storage にも保存されるので、
        同じブラウザからであればパスワードを入力しなくても編集できます。
        別のPCから編集したい場合や、ブラウザのキャッシュ (Local Storage)
        を消した場合にはパスワードを忘れると二度と編集できなくなるので、
        忘れないよう気をつけてください。
      </li>
    </>
  );
}
