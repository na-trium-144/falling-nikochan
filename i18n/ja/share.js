import main from "./main.js";
export default {
  share: {
    title: "{title} (ID: {cid})",
    titleWithComposer: "{title} / {composer} (ID: {cid})",
    description:
      "{chartCreator} さん作成の {title} の譜面をプレイしよう。" +
      main.main.descriptionVerbose,
    chartCreatorEmpty: "(名無し)",
    chartCreator: "譜面作成",
    isSample: "サンプル譜面",
    isPublished: "一般公開",
    shareLink: "共有用リンク",
    copyURL: "URLをコピー",
    share: "共有",
    copyForShare: "タイトルとURLをコピー",
    xPost: "𝕏 ポスト",
    selectLevel: "レベルを選択",
    chartInfo: "譜面情報",
    otherPlayers: "みんなのプレイ記録",
    bestScore: "あなたのベストスコア",
    detail: "詳細",
    start: "ゲーム開始！",
    unavailable: "公開されている譜面がまだありません。",
    titleWithResult: "{date} のプレイ記録 - {title}",
    titleWithResultNoDate: "プレイ記録 - {title}",
    descriptionWithResult:
      "{chartCreator} さん作成の {title} の譜面 ({level}{playbackRate}) をプレイし、" +
      "結果は {score, number, ::.00} 点{status} でした。" +
      main.main.descriptionVerbose,
    sharedResult: "共有されたプレイ記録",
    image: {
      shareImage: "結果を画像として保存・共有",
      download: "ダウンロード",
      copyImage: "画像をコピー",
      share: "共有",
      close: "閉じる",
    },
  },
};
