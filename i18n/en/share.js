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
    copyURL: "Copy URL",
    // Share dropdown menu button
    share: "Share",
    copyForShare: "Copy Title and URL",
    xPost: "𝕏 Post",
    selectLevel: "Select Level",
    chartInfo: "Chart Information",
    otherPlayers: "Others' Play Records",
    bestScore: "Best Score",
    // "Details →" button below best score
    detail: "Details",
    start: "Start Game!",
    unavailable: "No levels have been published yet.",
    titleWithResult: "Play record on {date} - {title}",
    titleWithResultNoDate: "Play record - {title}",
    descriptionWithResult:
      "Played the chart ({level}{playbackRate}) of {title} created by {chartCreator}, " +
      "and scored {score, number, ::.00} points{status}. " +
      main.main.descriptionVerbose,
    sharedResult: "Shared Play Record",
    image: {
      shareImage: "Save or Share Result as Image",
      download: "Download",
      copyImage: "Copy Image",
      share: "Share",
      close: "Close",
    },
  },
};
