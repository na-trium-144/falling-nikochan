export default {
  error: {
    api: {
      // 400
      badRequest: "パラメータが正しくありません",
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
      // 405
      readonlyOnDev:
        "development サーバーで production データベースに変更を加えることはできません",
      // 409
      oldChartVersion: "譜面データのバージョンが最新ではありません",
      unsupportedChartVersion: "サポートされていない譜面バージョンです",
      // 410
      noLongerSupportedAPI: "サポートされていない API です",
      // 412
      etagMismatch: "譜面データが更新されています。もう一度やり直してください",
      // 413
      tooLargeFile: "ファイルサイズが大きすぎます",
      tooManyEvent: "譜面データ内のイベント数が多すぎます",
      // 415
      invalidChart: "譜面データのフォーマットが正しくありません",
      unsupportedContentEncoding: "サポートされていない content-encoding です",
      invalidContentEncoding: "content-encoding が不正です",
      // 418
      noCORSCredentialsOnProd:
        "production サーバーで cookie を使ったクロスオリジンの認証はできません",
      // 429
      tooManyRequest: "しばらく待ってからやり直してください",
      // 500
      unknownApiError: "サーバーで何らかのエラーが発生しました",
      // 499
      fetchError: "サーバーへ接続できません (オフライン?)",
    },
    unknownApiError: "サーバーで何らかのエラーが発生しました",
    noSession: "セッションデータを読み込めません",
    chartVersion: "譜面データのバージョン (ver. {ver}) が正しくありません",
    badResponse: "何らかのエラーが発生しました",
    ytError: "YouTube 動画再生のエラー ({code})",
    noYtId: "再生する YouTube 動画が指定されていません",
    seqEmpty: "譜面データが空です",
    errorPage: {
      title: "エラーが発生しました 😢",
      goHome: "トップへ戻る",
      disableTranslation:
        "ブラウザの自動翻訳などをオフにして再度試してみてください。",
    },
  },
};
