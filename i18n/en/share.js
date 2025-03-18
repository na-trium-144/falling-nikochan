import main from "./main.js";
export default {
  share: {
    title: "{title} (ID: {cid})",
    titleWithComposer: "{title} / {composer} (ID: {cid})",
    description:
      "Play the chart of {title} created by {chartCreator}. " +
      main.main.descriptionVerbose,
    chartCreatorEmpty: "(Anonymous)",
    chartCreator: "Chart created by",
    isSample: "Sample Chart",
    isPublished: "Published",
    shareLink: "Share Link",
    copy: "Copy",
    share: "Share",
    selectLevel: "Select Level",
    chartInfo: "Chart Information",
    bestScore: "Best Score",
    start: "Start Game!",
    unavailable: "No levels have been published yet.",
    titleWithResult: "Play record on {date} - {title}",
    descriptionWithResult:
      "Played the chart ({level}) of {title} created by {chartCreator}, " +
      "and scored {score, number, ::.00} points{status}. " +
      main.main.descriptionVerbose,
    sharedResult: "Shared Play Record",
  },
};
