// フロントエンドで表示されることを想定していないものは訳さずキーをそのまま書く
export default {
  error: {
    api: {
      // 400
      badRequest: "パラメータが正しくありません",
      noPasswd: "パスワードが指定されていません",
      invalidChartId: "譜面 ID が正しくありません",
      invalidResultParam: "result パラメータが正しくありません",
      missingResultParam: "missingResultParam",
      unauthorizedResultBuildKey:
        "セッションキーを検証できませんでした。もう一度やり直すか、アプリを閉じて開きなおしてみてください。",
      unauthorizedSessionToken: "unauthorizedSessionToken",
      // 401
      badPassword: "パスワードが違います",
      // 404
      notFound: "指定したURLは存在しません",
      chartIdNotFound: "指定した譜面IDのデータはありません",
      levelNotFound: "指定したレベルのデータはありません",
      // 405
      methodNotAllowed: "許可されていないリクエストメソッドです",
      readonlyOnDev:
        "development サーバーで production データベースに変更を加えることはできません",
      // 409
      oldChartVersion: "譜面データのバージョンが最新ではありません",
      unsupportedChartVersion: "サポートされていない譜面バージョンです",
      recordAlreadyPosted: "recordAlreadyPosted",
      verificationNotApplicable: "プレイ記録を検証できませんでした。",
      timeMismatch:
        "端末の時刻が合っていません。時計を正しい時刻に合わせてから再度お試しください",
      // 412
      etagMismatch: "譜面データが更新されています。もう一度やり直してください",
      // 413
      tooLargeFile: "ファイルサイズが大きすぎます",
      tooManyEvent: "譜面データ内のイベント数が多すぎます",
      // 415
      invalidChart: "譜面データのフォーマットが正しくありません",
      unsupportedContentEncoding: "unsupportedContentEncoding",
      invalidContentEncoding: "invalidContentEncoding",
      // 418
      noCORSCredentialsOnProd:
        "production サーバーで cookie を使ったクロスオリジンの認証はできません",
      // 422
      unauthorizedSessionData: "unauthorizedSessionData",
      unauthorizedResultParam:
        "プレイ記録を検証できませんでした。URLが間違っているか、改変されている可能性があります",
      // 424
      ytMetaNotFound: "ytMetaNotFound",
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
    resultSessionExpired:
      "セッションがタイムアウトしました。この画面を閉じてもう一度やり直してください",
    errorPage: {
      title: "エラーが発生しました 😢",
      goHome: "トップへ戻る",
      disableTranslation:
        "ブラウザの自動翻訳などをオフにして再度試してみてください。",
    },
  },
};
