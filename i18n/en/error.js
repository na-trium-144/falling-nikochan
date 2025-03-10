export default {
  error: {
    api: {
      // 400
      noPasswd: "Password is not specified",
      invalidChartId: "Chart ID is invalid",
      invalidResultParam: "Result parameter is invalid",
      missingResultParam: "Result parameter is missing",
      // 401
      badPassword: "Password is incorrect",
      // 404
      notFound: "The specified URL does not exist",
      chartIdNotFound: "The specified chart ID does not exist",
      levelNotFound: "The specified level does not exist",
      // 409
      oldChartVersion: "The chart data version is not up to date",
      // 410
      noLongerSupportedAPI: "This API is no longer supported",
      // 413
      tooLargeFile: "File size is too large",
      tooManyEvent: "Too many events in the chart data",
      // 415
      invalidChart: "Invalid chart data format",
      // 429
      tooManyRequest: "Please wait a while and try again",
      // 500
      imageGenerationFailed: "Failed to generate the image",
      unsupportedChartVersion: "Unsupported chart data version",
    },
    unknownApiError: "An error occurred on the server",
    noSession: "Failed to load session data",
    chartVersion: "The version of the chart data (ver. {ver}) is abnormal",
    badResponse: "Failed to interpret the response from the server",
    ytError: "Error on the YouTube video ({code})",
    noYtId: "No YouTube video is specified",
    seqEmpty: "The chart data is empty",
  },
};
