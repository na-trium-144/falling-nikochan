export default {
  about: {
    1: {
      title: "Overview",
      content1:
        "A simple and cute rhythm game that you can play from your browser without downloading.",
      content2:
        "You can easily play on not only PC but also tablets and smartphones.",
      content3:
        "In addition to playing, anyone can create charts without registering an account or logging in.",
      content4:
        "The created charts are saved on the server and can be easily shared on SNS and played by others.",
    },
    2: {
      title: "How to Play",
      content1:
        "The rule is simple: hit the notes when Nikochan (smiley faces) overlaps the line.",
      content2:
        "Regardless of Nikochan's position or falling direction, " +
        "you can hit the notes by pressing any key on PC <inlineBlock>(except <key>Esc</key>)</inlineBlock>, <inlineBlock>or by tapping anywhere</inlineBlock> on the screen on tablets and smartphones.",
      content3:
        "You can hit big Nikochans just like normal Nikochans, " +
        "but if you press two keys at the same time or tap with two fingers, you will get more score than usual.",
      content4:
        "The more Nikochans you hit in a row without missing, " +
        "the more Chain bonus points you get, and the more score you get.",
      chain: "{chain, plural, =1 {chain} other {chains}}",
    },
    3: {
      title: "Create Charts",
      content1: "You can create charts using your favorite songs.",
      content2:
        "Falling Nikochan does not require you to download sound sources. " +
        "It plays sound sources by embedding <youtube>YouTube</youtube>, so you can use any music uploaded to YouTube.",
      content3:
        "In most cases, there are no copyright issues because we do not redistribute sound sources" +
        " <small>(except for illegal uploads or those that prohibit the use of YouTube embedding)</small>.",
      content4:
        "When you create a chart and upload it to Falling Nikochan's server, " +
        "a chart ID (6-digit number) is issued.",
      content5:
        "By sharing the chart ID or chart URL (<url></url>) on SNS, you can have others play it.",
    },
    4: {
      title: "Difficulty",
      content1:
        "There may be multiple charts (levels) for one song. " +
        "Each chart is labeled with a difficulty level such as <level>0</level>, <level>1</level>, or <level>2</level>.",
      content2:
        "<level>0</level> indicates a chart intended to be played with one hand, " +
        "and <level>1</level> indicates a chart intended to be played with two or more fingers or both hands. " +
        "(You don't have to play exactly as labeled.)",
      content3:
        "The number after the difficulty level (1-20) indicates the difficulty of the chart (the number of Nikochans falling). " +
        "(Please use it as a rough guide.)",
    },
    5: {
      title: "Game Specs",
      content1:
        "There are <good></good>, <ok></ok>, and <bad></bad> judgments depending on the timing of hitting Nikochan.",
      content2:
        "The score consists of <b>Base Score</b>, <b>Chain Bonus</b>, and <b>Big Notes Bonus</b>, " +
        "totaling {total} points (if you don't hit big Nikochans with two fingers, {totalSmall} points).",
      content3:
        "<b>Base Score</b> (out of {baseScoreRate} points) is calculated based on the judgment of the notes you hit. " +
        "If all notes are judged <good></good>, the total score will be {baseScoreRate}, and <ok></ok> judgments will receive {okBaseScore} times the score of <good></good> judgments.",
      content4:
        "<b>Chain Bonus</b> (out of {chainScoreRate} points) is a bonus score that increases depending on the Chain. " +
        "The longer the Chain, the higher the score.",
      content5:
        "<b>Big Notes Bonus</b> (out of {bigScoreRate} points) is a bonus score that you get when you hit big Nikochans with two fingers.",
      content6:
        "Based on the total score, you will be evaluated with the ranks <rank>70</rank>, <rank>80</rank>, <rank>90</rank>, <rank>100</rank>, <rank>110</rank>, and <rank>120</rank>.",
    },
  },
};
