import { levelColors, levelTypes } from "@/chartFormat/chart";

export function GuideContent5() {
  return (
    <>
      <li>
        1つの楽曲に複数の譜面データ(Level)を作成することができます。
        Levelを追加するには「Add」ボタン (空のLevelを作成)
        か、「Duplicate」ボタン (現在のLevelをコピー) を押してください。
      </li>
      <li>Levelには名前をつけることができます。 つけなくてもよいです。</li>
      <li>
        Levelの種類を
        {levelTypes.map((type, i) => (
          <span key={i}>
            「<span className={levelColors[i]}>{type}</span>」
          </span>
        ))}
        から選択することができます。
        <span className={levelColors[0]}>{levelTypes[0]}</span>
        では同時に設置できる音符が1つまで、
        <span className={levelColors[1]}>{levelTypes[1]}</span>
        では2つまでになります。
        <span className={levelColors[2]}>{levelTypes[2]}</span>
        には制限はありません。
      </li>
      <li>
        Levelにはさらに譜面の難易度を表す1〜20までの数字が自動でつきます。
        これは譜面内の音符の量(密度)を元に自動的に計算されます。
      </li>
      <li>
        「このレベルを非表示にする」にチェックを入れると、
        共有用リンクや譜面IDからこの譜面をプレイしようとした時にそのレベルは表示されなくなります。
        未完成の譜面を隠しておきながら完成したレベルだけ公開したい時などに使えます。
      </li>
    </>
  );
}
