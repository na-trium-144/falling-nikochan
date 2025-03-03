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
    copy: "コピー",
    share: "共有",
    selectLevel: "レベルを選択",
    bestScore: "ベストスコア",
    start: "ゲーム開始！",
    unavailable: "公開されている譜面がまだありません。",
    titleWithResult: "{date} のプレイ記録 | {title}",
    descriptionWithResult:
      "{chartCreator} さん作成の {title} の譜面 ({level}) のプレイ結果は、" +
      "{score, number, ::.00} 点{status} でした。" +
      main.main.descriptionVerbose,
    sharedResult: "共有されたプレイ記録",
  },
};
