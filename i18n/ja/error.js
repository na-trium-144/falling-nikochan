export default {
  error: {
    api: {
      // 400
      generic400: "パラメータが正しくありません",
      noPasswd: "パスワードが指定されていません",
      invalidChartId: "譜面 ID が正しくありません",
      invalidResultParam: "result パラメータが正しくありません",
      missingResultParam: "result パラメータが指定されていません",
      // 401
      badPassword: "パスワードが違います",
      // 404
      notFound: "指定したURLは存在しません",
      chartIdNotFound: "指定した譜面IDのデータはありません",
      levelNotFound: "指定したレベルのデータはありません",
      // 409
      oldChartVersion: "譜面データのバージョンが最新ではありません",
      // 410
      noLongerSupportedAPI: "サポートされていない API です",
      // 413
      tooLargeFile: "ファイルサイズが大きすぎます",
      tooManyEvent: "譜面データ内のイベント数が多すぎます",
      // 415
      invalidChart: "譜面データのフォーマットが正しくありません",
      // 429
      tooManyRequest: "しばらく待ってからやり直してください",
      // 500
      imageGenerationFailed: "画像生成に失敗しました",
      unsupportedChartVersion: "サポートされていない譜面バージョンです",
      // 502
      fetchError: "サーバーへの接続に失敗しました",
    },
    unknownApiError: "サーバーで何らかのエラーが発生しました",
    noSession: "セッションデータを読み込めません",
    chartVersion: "譜面データのバージョン (ver. {ver}) が異常です",
    badResponse: "サーバーからの応答を解釈できません",
    ytError: "YouTube 動画再生のエラー ({code})",
    noYtId: "再生する YouTube 動画が指定されていません",
    seqEmpty: "譜面データが空です",
    errorPage: {
      title: "エラーが発生しました 😢",
      goHome: "トップへ戻る",
    },
  },
};
