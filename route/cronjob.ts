import {
  reportPopularCharts,
  checkNewCharts,
  reportToDiscord,
} from "@falling-nikochan/route";

try {
  await reportPopularCharts(process.env as any);
} catch (e) {
  await reportToDiscord(
    process.env as any,
    "Uncaught exception in reportPopularCharts():\n" + String(e)
  );
}
try {
  await checkNewCharts(process.env as any);
} catch (e) {
  await reportToDiscord(
    process.env as any,
    "Uncaught exception in checkNewCharts():\n" + String(e)
  );
}
