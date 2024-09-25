export function AboutContent3() {
  return (
    <>
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
}
