import { metaDataTitle } from "@/common/title";
import { tabTitles } from "../const";
import { IndexMain } from "../main";
import Link from "next/link";
import { ReactNode } from "react";
import { linkStyle2 } from "@/common/linkStyle";

export function generateMetadata() {
  return metaDataTitle(tabTitles[3]);
}

interface PProps {
  header: string;
  children: ReactNode | ReactNode[];
}
function Paragraph(props: PProps) {
  return (
    <div className="mb-3">
      <h3 className="text-xl font-bold font-title mb-2">{props.header}</h3>
      <ul className="pl-2 list-inside list-disc">{props.children}</ul>
    </div>
  );
}
export default function PolicyTab() {
  return (
    <IndexMain tab={3}>
      <Paragraph header="ソフトウェアとして">
        <li>
          Falling Nikochan はオープンソースのソフトウェアであり、
          <Link
            className={"mx-1 text-blue-800 " + linkStyle2}
            href="https://github.com/na-trium-144/falling-nikochan"
          >
            GitHub 上に
          </Link>
          ソースコードを公開しています。
        </li>
        <li>
          MIT License で公開しており、複製、改変、再配布などをしても構いません。
          ライセンス本文は
          <Link
            className={"mx-1 text-blue-800 " + linkStyle2}
            href="https://github.com/na-trium-144/falling-nikochan/blob/main/LICENSE"
          >
            こちら
          </Link>
          を参照してください。
        </li>
        <li>
          また Falling Nikochan
          が使用しているサードパーティーのライブラリやパッケージについても、
          それぞれのライセンスが適用されます。
        </li>
      </Paragraph>
      <Paragraph header="サービスとして">
        <li>
          以下の規約は、作者が管理しているドメイン (nikochan.natrium144.org)
          で提供される Falling Nikochan のサービス (以下、本サービス)
          を利用する利用者とサービス提供者 (= Falling Nikochan の作者,
          na-trium-144) の間の関係に適用されます。
        </li>
        <li>
          第三者がこれ以外のドメインで Falling Nikochan
          のサービスを提供している場合は、
          その利用については作者は関与しません。
        </li>
      </Paragraph>
      <Paragraph header="利用者の情報について">
        <li>
          Falling Nikochan はユーザー登録なしで利用することができます。
          利用者に個人情報の入力を求めることはありません。
        </li>
        <li>
          利用者がプレイした譜面の履歴
          (トップページの「プレイする」画面に一覧表示されるもの)
          や、ベストスコアなどのプレイ記録は、利用者のブラウザーの Local Storage
          に保存されます。 これらの情報がサーバーに送信されることはありません。
        </li>
        <li>
          本サービスは利用者のIPアドレスを収集しています。
          主に利用者の譜面データのアップロード回数を制限するために使用しています。
          それ以外の目的に使用したり第三者に提供したりすることはありません。
        </li>
      </Paragraph>
      <Paragraph header="YouTube">
        <li>
          本サービスは YouTube IFrame Player API を利用していますが、 Fallling
          Nikochan は YouTube とは無関係なサービスです。 本サービスについて
          YouTube に問い合わせないでください。
        </li>
        <li>
          本サービスでは YouTube 動画をアプリ内に埋め込むことでのみ YouTube
          の動画を利用しています。 非公式の方法で YouTube
          の動画を複製・ダウンロードしたり、
          サーバーに保存したりといったことは行っていません。
        </li>
        <li>
          Falling Nikochan 内で YouTube の動画を再生すると、 YouTube
          の元の動画の再生数としてカウントされ、 収益は元の動画の投稿者
          (またはその動画で使用しているコンテンツの著作権者) のものとなります。
          本サービスがこれにより収益を得ることはありません。
        </li>
      </Paragraph>
      <Paragraph header="譜面のアップロードについて">
        <li>
          本サービスではユーザー登録なしで誰でも譜面をアップロードすることができます。
          利用者がアップロードした譜面は、 Falling Nikochan
          のサーバーに保存されます。
        </li>
        <li>
          譜面作成時には、編集用パスワードを設定することができます。
          編集に使用したブラウザーの Local Storage
          にもパスワードが保存されるので通常はパスワードを入力しなくても編集できますが、
          PCやブラウザを変更した場合、またブラウザーに保存されたデータを削除した場合などには、
          パスワードの入力が求められることがあります。
        </li>
        <li>
          Falling Nikochan
          では利用者の個人情報を保存しておらず本人確認をすることができないため、
          パスワードを忘れた場合再設定する方法は用意しておりません。
          利用者の責任で管理してください。
        </li>
        <li>
          本サービスは個人で運営しているサービスであるため、
          サーバーに保存されているデータについて機密性、完全性、可用性は保証できません。
          悪意のある第三者によって、または作者の過失によってデータが流出したり消失したりした場合、
          利用者が被った不利益や損害について、作者は責任を負いません。
          データのバックアップなどは利用者の責任で行ってください。
        </li>
      </Paragraph>
      <Paragraph header="禁止事項">
        <li>
          著作権などを侵害する行為はしないでください。
          特に違法にアップロードされている動画や、 著作権者が YouTube
          埋め込みでの利用を禁止しているコンテンツなどは、
          本サービスでは使用しないようにしてください。
        </li>
        <li>
          必要以上のアクセスでサーバーに負荷をかけたり、
          サーバーへの不正アクセスなど、
          サービスの運営を妨害する行為はしないでください。
        </li>
        <li>
          利用者がアップロードしたデータが、
          法令または公序良俗に反する内容や、閲覧者が不快に感じる内容、
          その他不適切であるとこちらが判断したものである場合には、
          該当するデータをサーバーから削除したり、
          また該当する利用者の本サービスへのアクセスを制限する場合があります。
        </li>
      </Paragraph>
      <Paragraph header="サービスの変更、停止など">
        <li>
          作者は本規約を予告なく変更することができます。
          本サービスを継続して利用している利用者は本規約の変更に同意したものとします。
        </li>
        <li>
          作者は本サービスの一部または全部を予告なく変更、停止することができます。
          それに関連して利用者が被った不利益や損害について、作者は責任を負わないものとします。
        </li>
      </Paragraph>
    </IndexMain>
  );
}
