import { ReactNode } from "react";

export function GuideContent7() {
  return (
    <>
      <li>
        Code タブでは譜面データをテキスト (Lua 言語のプログラム)
        として編集することができます。
        TimingタブやNoteタブで編集した内容は自動的にCodeタブにも反映され、
        逆にCodeタブの編集も自動的に他のタブに反映されます。
        <br />
        Codeタブを一切使わなくても譜面は作れますが、
        複数の音符をまとめて選択してコピペすることができたり、
        またLua言語が書ければ変数やループ、functionなどを使うこともできるので、
        使いこなせると便利かもしれません。
      </li>
      <li>
        基本的なルールとしては、 テキストは上から順に読み、<Code>Note()</Code>
        が音符1つを表し、
        <Code>Step()</Code>が休符(音符と音符の間の空き時間)を表します。
        <br />
        Noteタブでは音符の追加と削除しかできず、すでに置かれている音符のタイミングをすべてずらすといったことはできませんが、
        Codeタブでは<Code>Step()</Code>
        を挿入したり削除するとそれ以降の音符のタイミングがすべてずれます。
      </li>
      <li>
        Codeタブを編集すると、自動的に編集したコードが実行されます。
        エラーが発生した場合(文法が間違っている場合など)は下部に赤色でメッセージが表示されます。
        <br />
        エラーが表示されている状態でCodeタブ以外のタブへ移動すると、
        Codeタブの変更は保存されず、最後にエラーなく実行できた時点の内容に戻されてしまうので注意してください。
      </li>
      <li>
        Codeタブで<Code>Note()</Code>などの各種コマンドにカーソルを合わせると、
        タイムバーもその音符に対応する時刻に移動します(が100%正確ではないです)。
      </li>
      <li>Falling Nikochan 特有のコマンドは以下の通りです。</li>
      <li className="ml-6">
        <Code>Note(x, vx, vy, big)</Code>: 音符を置きます。 x, vx, vy は数値、
        big は<Code>true</Code>または<Code>false</Code>
        を指定してください。
      </li>
      <li className="ml-6">
        <Code>Step(a, b)</Code>: b 分音符 a 個分の休符を表します。 a
        は0以上の整数、 b は1以上の整数にしてください。
      </li>
      <li className="ml-6">
        <Code>BPM(bpmの値)</Code>: BPMを変更します。正の数値にしてください。
      </li>
      <li className="ml-6">
        <Code>Accel(speedの値)</Code>: Speedを変更します。0や負の値も使えます。
      </li>
      <li>
        <Code>--</Code>
        (半角のマイナス2つ)で始まる行はコメントです(何を書いても無視されます)。
      </li>
      <li>
        その他のLua言語の文法に関してはここでは説明しないので各自で調べてください。
      </li>
    </>
  );
}

function Code(props: { children: ReactNode }) {
  return (
    <span className="font-mono text-sm mx-1 rounded-sm ">{props.children}</span>
  );
}
