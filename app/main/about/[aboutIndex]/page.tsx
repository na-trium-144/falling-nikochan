import { IndexMain } from "@/main/main";
import { Params } from "next/dist/shared/lib/router/utils/route-matcher";
import Link from "next/link";

const maxIndex = 3;
export default function AboutTab(context: { params: Params }) {
  const aboutIndex = Number(context.params.aboutIndex);

  return (
    <IndexMain tab={0}>
      <div className="flex-1">
        <AboutContent index={aboutIndex} />
      </div>
      <div className="flex flex-row items-baseline">
        <div className="flex-1 text-right">
          {aboutIndex > 1 && (
            <Link
              className="p-2 aspect-square rounded-full text-xl text-bold hover:bg-gray-200"
              href={`/main/about/${aboutIndex - 1}`}
            >
              &lt;
            </Link>
          )}
        </div>
        <span className="w-6 text-right">{aboutIndex}</span>
        <span className="mx-2">/</span>
        <span className="w-6 text-left">{maxIndex}</span>
        <div className="flex-1 text-left">
          {aboutIndex < maxIndex && (
            <Link
              className="p-2 aspect-square rounded-full text-xl text-bold hover:bg-gray-200"
              href={`/main/about/${aboutIndex + 1}`}
            >
              &gt;
            </Link>
          )}
        </div>
      </div>
    </IndexMain>
  );
}

function AboutContent(props: { index: number }) {
  switch (props.index) {
    case 1:
      return (
        <>
          <h3 className="text-xl font-bold font-title">
            FallingNikochanの概要
          </h3>
          <ul className="list-inside list-disc">
            <li>
              ダウンロード不要でブラウザーからすぐに遊べる、シンプルでかわいいリズムゲームです。
            </li>
            <li>
              PCだけでなくタブレットやスマートフォンなどでも手軽に遊べるのが特徴で、音楽ゲームにあまり馴染みがない方でも楽しめると思います。
            </li>
            <li>
              さらに、プレイするだけでなく誰でも簡単に譜面を作成でき、それをSNSなどでシェアして遊んでもらうこともできます
            </li>
            <li>todo: 概要説明が文章だけでダサいのでなんとかする</li>
          </ul>
        </>
      );
    case 2:
      return (
        <>
          <h3 className="text-xl font-bold font-title">
            FallingNikochanのルール
          </h3>
          <ul className="list-inside list-disc">
            <li>
              ニコチャンが線に重なったときに音符を叩くだけの簡単なルールです。
            </li>
            <li>
              PCなら(Esc以外の)どれかのキーを押して、タブレット・スマホなら画面のどこかをタップすることで音符を叩きます。
            </li>
            <li>
              大きいニコチャンは2つのキーを同時押し、または2本指でタップすることで、通常より多くのスコアが入ります
            </li>
            <li>ミスせず連続でニコチャンを叩くと得られるスコアも増えます</li>
            <li>todo: 画像</li>
          </ul>
        </>
      );
    case 3:
      return (
        <>
          <h3 className="text-xl font-bold font-title">譜面を作ろう</h3>
          <ul className="list-inside list-disc">
            <li>YouTubeにある好きな楽曲にあわせて、譜面を作ることができます</li>
            <li>
              音源はダウンロードされるのではなく、YouTube自体がアプリ内に埋め込まれているため、YouTubeで公開されている楽曲を使う分には権利的な問題は発生しません。
            </li>
            <li className="pl-8">
              (FallingNikochanで音源を再生するとYouTube上の元の動画の再生回数が1増えます)
            </li>
            <li>
              作った譜面は、URLまたは譜面IDを公開することで、他の人に遊んでもらうことができます
            </li>
          </ul>
        </>
      );
    default:
      return <p>Not Found</p>;
  }
}
