export default {
  error: {
    api: {
      // 400
      badRequest: "The parameter is invalid",
      noPasswd: "Password is not specified",
      invalidChartId: "Chart ID is invalid",
      invalidResultParam: "Result parameter is invalid",
      missingResultParam: "missingResultParam",
      unauthorizedResultBuildKey:
        "The session key could not be verified. Please try again, or close and reopen the app.",
      unauthorizedSessionToken: "unauthorizedSessionToken",
      // 401
      badPassword: "Password is incorrect",
      // 404
      notFound: "The specified URL does not exist",
      chartIdNotFound: "The specified chart ID does not exist",
      levelNotFound: "The specified level does not exist",
      // 405
      methodNotAllowed: "Method not allowed",
      readonlyOnDev:
        "Modification to the production database is not allowed on the development server",
      // 409
      oldChartVersion: "The chart data version is not up to date",
      unsupportedChartVersion: "Unsupported chart data version",
      recordAlreadyPosted: "recordAlreadyPosted",
      verificationNotApplicable: "Unable to verify the play record. ",
      timeMismatch:
        "The device clock is out of sync. Please check your time settings and try again.",
      // 412
      etagMismatch: "Chart data has been updated. Please try again",
      // 413
      tooLargeFile: "File size is too large",
      tooManyEvent: "Too many events in the chart data",
      // 415
      invalidChart: "Invalid chart data format",
      unsupportedContentEncoding: "unsupportedContentEncoding",
      invalidContentEncoding: "invalidContentEncoding",
      // 418
      noCORSCredentialsOnProd:
        "Cross-origin authentication using cookie is not allowed on the production server",
      // 422
      unauthorizedSessionData: "unauthorizedSessionData",
      unauthorizedResultParam:
        "Unable to verify the play record. The URL may be incorrect or has been altered.",
      // 424
      ytMetaNotFound: "ytMetaNotFound",
      // 429
      tooManyRequest: "Please wait a while and try again",
      // 500
      unknownApiError: "An error occurred on the server",
      // 499
      fetchError: "Failed to connect to the server (offline?)",
    },
    unknownApiError: "An error occurred on the server",
    noSession: "Failed to load session data",
    chartVersion: "The version of the chart data (ver. {ver}) is invalid",
    badResponse: "An unknown error occurred",
    ytError: "Error on the YouTube video ({code})",
    noYtId: "No YouTube video is specified",
    seqEmpty: "The chart data is empty",
    resultSessionExpired:
      "The session has timed out. Please close this screen and try again.",
    errorPage: {
      title: "An error has occurred 😢",
      goHome: "Return to top page",
      disableTranslation:
        "Please disable your browser's automatic translation or extensions and try again.",
    },
  },
};
