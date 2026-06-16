declare module "ace-builds/src-min-noconflict/*";
declare module "*?raw" {
  const content: string;
  export default content;
}

// declare module "react/jsx-runtime" や declare global と書かれている記事があったがなぜかうまくいかず、
// いろいろ試した結果これでできた。なぜかはわからない
declare namespace React {
  namespace JSX {
    interface IntrinsicElements {
      "fn-glass-1": UnknownHTMLProps;
      "fn-glass-2": UnknownHTMLProps;
      "fn-highlight": UnknownHTMLProps;
      "fn-falling-window": UnknownHTMLProps;
      "fn-target-line": UnknownHTMLProps;
      "fn-music-area": UnknownHTMLProps;
      "fn-volume-control": UnknownHTMLProps;
      "fn-cloud": UnknownHTMLProps;
      "fn-youtube": UnknownHTMLProps;
      "fn-slime": UnknownHTMLProps;
      "fn-rhythmical-slimes": UnknownHTMLProps;
      "fn-bpm-sign": UnknownHTMLProps;
      "fn-timebar": UnknownHTMLProps;
      "fn-help-icon": UnknownHTMLProps;
      "fn-lua-editor": UnknownHTMLProps;
      "fn-level-badge": UnknownHTMLProps;
      "fn-modal-bg": UnknownHTMLProps;
      "fn-centered-box-bg": UnknownHTMLProps;
      "fn-changelog-bg": UnknownHTMLProps;
    }
  }
}
type UnknownHTMLProps = React.DetailedHTMLProps<React.HTMLAttributes<HTMLUnknownElement>, HTMLUnknownElement>;
