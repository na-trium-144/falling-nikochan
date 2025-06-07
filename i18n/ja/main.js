export default {
  main: {
    description:
      "誰でも譜面を作成し共有することができる、" +
      "シンプルでかわいい音ゲーです。",
    descriptionVerbose:
      "Falling Nikochan は、誰でも譜面を作成し共有することができる、" +
      "シンプルでかわいい音ゲーです。",
    redirected:
      "2025年3月に Falling Nikochan のサイトのURLは <url></url> に移転しました。",
    back: "戻る",
    pwa: {
      installWithPrompt:
        "Falling Nikochan をホーム画面に追加してアプリとして起動することにより、" +
        "フルスクリーンでより快適に遊ぶことができます。",
      install: "ホーム画面に追加",
      installWithoutPrompt:
        "ブラウザのメニューから「ホーム画面に追加」を選択してアプリとして起動することにより、" +
        "フルスクリーンでより快適に遊ぶことができます。",
      installIOS:
        "Safari の共有メニューから「ホーム画面に追加」を選択してアプリとして起動することにより、" +
        "フルスクリーンでより快適に遊ぶことができます。",
      dismiss: "閉じる",
      updating: "更新をダウンロード中...",
      updateDone: "更新が完了しました！",
      updateFailed: "更新に失敗しました...",
    },
    inputId: "譜面IDを入力",
    inputIdDesc:
      "プレイしたい譜面の ID を知っている場合はこちらに入力してください。",
    inputIdDesc2:
      "譜面のURL (<url></url>) にアクセスすることでもプレイできます。",
    inputDirect: "譜面IDを指定し直接プレイ画面に飛ぶ",
    inputDirectDevonly: "dev環境限定、 /share/cid のパスが使えない代わり",
    about: {
      title: "Falling Nikochan とは？",
    },
    top: {
      titleShort: "ホーム",
    },
    play: {
      title: "公開されている譜面で遊ぶ",
      titleShort: "公開譜面",
      description:
        "人気の譜面 / 新着譜面 / サンプル譜面 から曲を探すことができます。",
      search: "検索",
      searchDesc: "曲名や作曲者、譜面製作者などから検索します。",
      searchTitle: "{search} の検索結果",
      recent: "最近プレイした譜面",
      popular: "人気の譜面",
      popularDesc: "直近 {popularDays} 日間にプレイされた回数の多い譜面です。",
      latest: "新着譜面",
      latestDesc: "最近作成・更新された譜面の一覧です。",
      latestDesc2:
        "譜面を制作する方へ: 譜面編集から「一般公開する」にチェックを入れると、数分後にここに反映されます。",
      sample: "サンプル譜面",
      sampleDesc:
        "Falling Nikochan の作者 <small>(na-trium-144)</small> が作った譜面です。" +
        "初めての方はこちらからどうぞ。",
      sampleDesc2:
        "また、これ以外にも Falling Nikochan の YouTube チャンネル <youtube>@nikochan144</youtube> で譜面を公開しています。",
      sampleDevonly:
        "dev環境ではタイトルや作曲者だけ入力したダミーのファイルが表示されます",
    },
    edit: {
      title: "譜面を作る",
      titleShort: "譜面作成",
      description:
        "Falling Nikochan の譜面エディタにようこそ。" +
        "アカウント登録不要で誰でも譜面を作成することができます。" +
        "新しくサーバーに譜面を保存するのは{rateLimitMin}分ごとに1回までに制限しています。" +
        " (1度保存した譜面の上書きは何回でもできます。)",
      welcome:
        "Falling Nikochan の譜面エディタにようこそ。" +
        "アカウント登録不要で誰でも譜面を作成することができます。",
      welcome2: "初めての方はこちらも参考にどうぞ。",
      howToVideo: "Falling Nikochan 譜面の作り方",
      inputId: "譜面IDを入力",
      inputIdDesc:
        "編集したい譜面の ID を知っている場合はこちらに入力してください。" +
        " ID 入力後、編集用パスワードも必要になります。",
      newTab: "新しいタブで開く",
      recentEdit: "最近編集した譜面",
      new: "新しく譜面を作る",
      newButton: "新規作成",
      newDesc:
        "新しくサーバーに譜面を保存するのは{rateLimitMin}分ごとに1回までに制限しています。" +
        " (1度保存した譜面の上書きは何回でもできます。)",
      safariLSWarning:
        "MacのSafariおよびiOSでは、7日間ウェブサイトへのアクセスがない場合" +
        "編集した譜面のリストやパスワードなどのブラウザに保存したデータがすべて削除されてしまいます。",
    },
    chartList: {
      showAll: "もっと表示",
      empty: "まだありません",
      notFound: "見つかりませんでした",
    },
    policies: {
      title: "利用規約っぽいもの",
    },
    version: {
      title: "バージョン情報",
      changelog: "主な更新履歴",
      description: "Falling Nikochan のバージョン情報 / 主な更新履歴です。",
      about: "Falling Nikochan について",
      supportedBrowsers:
        "対応ブラウザは {browserslist} です。" +
        "それ以前のバージョンでは一部正常に動作・表示しない可能性があります。",
    },
    links: {
      title: "お問い合わせ先・その他リンク",
      titleShort: "その他",
      description: "Falling Nikochan のお問い合わせ先・その他リンクです。",
      about: "Falling Nikochan について",
      supportedBrowsers:
        "対応ブラウザは {browserslist} です。" +
        "それ以前のバージョンでは一部正常に動作・表示しない可能性があります。",
      version: "バージョン",
      changelog: "更新履歴はこちら",
      policies: "利用規約っぽいもの",
      settings: "設定",
      theme: "テーマ色",
      light: "ライト",
      dark: "ダーク",
      default: "自動",
      contactForm: "お問い合わせフォーム",
      officialChannel: "Falling Nikochan 公式チャンネル (@nikochan144)",
      officialChannelShort: "公式チャンネル",
    },
    festival:
      "ut.code(); 第{num}回{kind, select, mf {五月祭} kf {駒場祭} other {other}}ウェブサイトに戻る",
  },
  footer: {
    theme: "テーマ色",
    light: "ライト",
    dark: "ダーク",
    default: "自動",
  },
};
