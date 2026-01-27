export default {
  play: {
    description:
      "This is the URL for the Falling Nikochan's game itself. (Sharing this URL alone will not work)",
    message: {
      ready: "Ready to start!",
      stopped: "Stopped",
      start: "Start",
      reset: "Restart",
      exit: "Exit",
      howToPause:
        "You can pause by pressing " +
        "the <pause></pause> button at the top of the screen.",
      editingNotification:
        "Changes made in the editing screen will be " +
        "reflected here after reloading the page.",
      option: "Options",
      // auto play or manual play
      auto: "Auto Play",
      enableSE: "Enable Key/Tap Sounds",
      enableSELatency: "There may be a delay of {latency} seconds.",
      unknownSELatency: "There may be a delay in sound output.",
      enableIOSThru: "Predict and correct unresponsive taps",
      iOSThruHelp:
        "Due to a bug in Safari, taps with two or more <br></br>" +
        "fingers may become unresponsive. <br></br>" +
        "Predict and correct this under certain <br></br>" +
        "conditions and maintain your chain.",
      // unused option
      displaySpeed: "Show Note Speed",
      offset: "Offset Adjustment",
      // adjust offset automatically or not
      autoOffset: "Auto",
      offsetSecond: "sec",
      offsetFast: "Fast",
      offsetLate: "Late",
      off: "Off",
      // Ja:"再生速度を変える"(Change Playback Speed)
      playbackRate: "Playback Speed",
      // Ja:"途中から練習"(Practice from Middle)
      userBegin: "Practice from",
      // shorter version of playbackRate to fit on mobile screen
      playbackRateDisplay: "Speed",
    },
    score: {
      auto: "Auto Play",
      score: "Score",
      // for some reason I picked "chain" for En while "コンボ"(combo) for Ja
      chain: "{chain, plural, =1 {chain} other {chains}}",
      // write the longest singular, plural, or whatever form of "chain" above
      // (needed for layout adjustments)
      chainLong: "chains",
    },
    status: {
      bestScore: "Best Score",
      good: "Good",
      ok: "OK",
      bad: "Bad",
      miss: "Miss",
      big: "Big Notes",
      remains: "Remaining",
    },
    result: {
      result: "Result",
      baseScore: "Base Score",
      chainBonus: "Chain Bonus",
      bigNoteBonus: "Big Notes Bonus",
      totalScore: "Total Score",
      rank: "Rank",
      // Ja:"パーフェクト"(Perfect) only
      perfect: "Perfect Chain",
      // Ja:"フルコンボ"(Full Combo)
      full: "Full Chain",
      // Ja:"ベストスコア更新！"(Best score updated!)
      newRecord: "New Record!",
      message: {
        A: {
          1: "Fantastic!",
          2: "Amazing!",
          3: "Excellent!",
        },
        B: {
          1: "Nice job!",
          2: "Great!",
          3: "Cool!",
        },
        C: {
          1: "Good effort!",
          2: "Keep trying!",
          3: "Better luck next time!",
        },
      },
      reset: "Restart",
      exit: "Exit",
      shareResult: "Share your result!",
      otherPlayers: "Others' Play Records",
      playbackRate: "Speed",
    },
  },
};
