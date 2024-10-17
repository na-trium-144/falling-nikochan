export function GuideContent3() {
  return (
    <>
      <li>
        画面上部の「Play」ボタンで楽曲を再生・停止できます。
        まれに「Play」を押しても反応しない場合があるので、その場合はページを再読み込みしてください。
        (その場合保存していない変更は失われます。)
      </li>
      <li>
        操作ボタンの下にタイムバーを表示しています。
        上部に秒単位の時間、下部に拍数単位の時間とBPM設定、Speed設定を表示しています。
        また音符を置くとどのタイミングにいくつ音符が置かれているかも表示されます。
      </li>
      <li>右下の「-」「+」ボタンで拡大縮小表示できます。</li>
      <li>
        Step = 1 / 16 の部分で音符間隔を設定できます。 上部の「-1 Step」「+1
        Step」などのボタンを押すとその分だけ時間を戻したり進めることができます。
        Stepを変更してもすでに置かれている音符には影響しません。
        <br />
        現在は 1 / (4の倍数) のみが使用できます。 3連符は 1 / 12 や 1 /
        24、5連符は 1 / 20 などとすれば置くことができます。
      </li>
    </>
  );
}
