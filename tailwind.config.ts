import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{js,ts,jsx,tsx,mdx}"],
  theme: {
    screens: {
      "main-wide": "40rem", // タイトルと各タブの内容が別ページ
      "footer-wide": "35rem", // Footerのナビゲーションを横並びにする & build情報表示
      "footer-wide2": "35rem", // build情報を横並びにする
      "edit-wide": "50rem", // editのPC表示
      "share-yt-wide": "60rem", // shareでYouTubeを表示する場所が変わる
    },
  },
  plugins: [],
};
export default config;
