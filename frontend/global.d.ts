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
      // 追加要素のないHTMLElementで最短というだけで、i に特に意味はない
      "fn-glass-1": JSX.IntrinsicElements.i;
      "fn-glass-2": JSX.IntrinsicElements.i;
      "fn-highlight": JSX.IntrinsicElements.i;
    }
  }
}
