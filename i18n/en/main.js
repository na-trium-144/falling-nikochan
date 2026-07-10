export default {
  main: {
    description:
      "Simple and cute rhythm game, " +
      "where anyone can create and share charts.",
    // just adding "Falling Nikochan is,"
    descriptionVerbose:
      "Falling Nikochan is a simple and cute rhythm game, " +
      "where anyone can create and share charts.",
    playNow: "Play Now",
    editNow: "Chart Editor",
    popularMore: "Show More",
    redirected:
      "The URL of Falling Nikochan site has been moved to <url></url> in March 2025.",
    // "← Back" button
    back: "Back",
    popular: "Popular Songs",
    howToPlay: {
      title: "What is Falling Nikochan?",
      content1:
        "A simple and cute rhythm game that you can play from your browser without downloading.",
      content3:
        "The rule is simple: when Nikochan (smiley faces) overlaps the line, you press a key or tap anywhere on the screen. " +
        "It's easy to play not only on PCs but also on tablets and smartphones.",
      content5:
        "You can hit big Nikochans just like normal Nikochans, " +
        "but if you press two keys at the same time or tap with two fingers, you will get more score than usual.",
      about: "Learn more about the game rule",
    },
    howToEdit: {
      title: "Create Charts",
      content1: "In Falling Nikochan, anyone can create and publish charts.",
      content2:
        "It plays sound sources by embedding <youtube>YouTube</youtube>, so you can use any music uploaded to YouTube.",
      content5:
        "You can share the charts you create with other users by providing them with either the issued chart ID (a 6-digit number) or the URL (<url></url>).",
    },
    pwa: {
      // Android Chrome
      installWithPrompt:
        "For a more comfortable full-screen experience, " +
        "add Falling Nikochan to your home screen and launch it as an app.",
      install: "Add to Home Screen",
      // Android Firefox and others
      installWithoutPrompt:
        "For a more comfortable full-screen experience, " +
        'select "Add to home screen" from your browser\'s menu and launch it as an app.',
      // iOS Safari
      installIOS:
        "For a more comfortable full-screen experience, " +
        'select "Add to home screen" from Safari\'s share menu and launch it as an app.',
      dismiss: "Not now",
      // Only used on PWA
      updating: "Downloading update...",
      updateDone: "Update completed!",
      updateFailed: "Update failed...",
    },
    about: {
      title: "Game Specifications",
      description:
        "Regarding the rules, judgment, and scoring specifications of Falling Nikochan as a rhythm game.",
    },
    top: {
      // used in mobile navigation
      titleShort: "Home",
    },
    play: {
      // pc
      title: "Play with Public Charts",
      // mobile navigation
      titleShort: "Play",
      titleHeader: "Game Play",
      description: "List of published charts.",
      descriptionX:
        "Updates are also announced on the official account of <xlogo></xlogo> <twitter>@nikochan144</twitter>.",
      descriptionPublic:
        "Check 'Publish this chart' in chart editor to reflect here after a few minutes.",
      search: "Search",
      searchPlaceholder: "Song title, composer, etc. or chart ID",
      searchTitle: "Search results for {search}",
      cidNotFound: "The chart ID {cid} was not found.",
      sort: "Sort by",
      recent: "Play history",
      relevance: "Relevance",
      latest: "Latest",
      popular: "Popular",
      popularDesc: "Sorted by the most played in the last {popularDays} days.",
      latestDesc: "Sorted by the most recently created or updated.",
      level: "Level",
    },
    edit: {
      title: "Create a Chart",
      titleShort: "Create",
      titleHeader: "Chart Editor",
      description:
        "Welcome to Falling Nikochan chart editor. " +
        "You can create charts without an account. " +
        "You can save a chart to the server once every {rateLimitMin} minutes." +
        " (You can overwrite a chart as many times as you want.)",
      welcome:
        "Welcome to Falling Nikochan chart editor. " +
        "You can create charts without an account.",
      welcome2: "If you're new, you can also refer to this:",
      howToVideo: "How to make a chart for Falling Nikochan",
      inputId: "Enter Chart ID",
      inputIdDesc:
        "Enter the ID of the chart you want to edit. " +
        "Password is required after entering ID.",
      newTab: "Open in new tab",
      recentEdit: "Recently Edited Charts",
      new: "Create New Chart",
      newButton: "Create",
      newDesc:
        "You can save a chart to the server once every {rateLimitMin} minutes." +
        " (You can overwrite a chart as many times as you want.)",
      safariLSWarning:
        "In Mac Safari and iOS, if you do not access the website for 7 days, " +
        "all data saved in the browser, such as the list of edited charts and passwords, will be deleted.",
    },
    chartList: {
      chartCreator: "Chart by",
      // "Show More →" button
      showAll: "Show More",
      empty: "No charts yet",
      notFound: "No charts found",
    },
    policies: {
      title: "Terms of Use",
      titleShort: "Terms of Use",
      license: {
        showDetail: "Show Details",
        // "× Close" button
        closeDetail: "Close",
        // "Source: https://github.com/username/repo↗︎"
        source: "Source",
      },
      content1: "Falling Nikochan is open source.",
      content2:
        "Falling Nikochan can be used without user registration for both playing and creating charts, and does not collect personal information.",
      content3:
        "The music and videos used in the game are played by directly embedding the videos in accordance with YouTube's terms of service, " +
        "and the rights to the videos belong to the original copyright holders.",
    },
    version: {
      title: "Version Info",
      changelog: "Main Change Logs",
      description:
        "Version information and main change logs of Falling Nikochan.",
      about: "About Falling Nikochan",
      supportedBrowsers:
        "Supported browsers are {browserslist}. " +
        "Some parts may not function or display properly in earlier versions.",
      showAll: "Show More",
    },
    social: {
      title: "Social Links",
      discord: {
        online: "{num} Online",
        members: "{num} Members",
        join: "Join The Discord Server",
      },
    },
    links: {
      title: "Other",
      titleShort: "Other",
      description: "'Other' page for mobile UI",
      contactLinks: "Contact Links",
      about: "About Falling Nikochan",
      supportedBrowsers:
        "Supported browsers are {browserslist}. " +
        "Some parts may not function or display properly in earlier versions.",
      version: "Version Info",
      changelog: "Changelogs here",
      settings: "Settings",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      default: "System Default",
      contactForm: "Contact Form",
      // long version for pc, short version for mobile
      officialChannel: "Falling Nikochan Official Channel (@nikochan144)",
      officialChannelShort: "Official Channel",
      officialAccount: "Falling Nikochan Official Account (@nikochan144)",
      officialAccountShort: "Official Account",
      apiReference: "Falling Nikochan API Reference",
      apiReferenceShort: "API Reference",
      devPage: "Debugging Page",
      aboutUTCode: "About ut.code();",
    },
    // previously used in a school festival in the university of tokyo
    festival:
      "Back to the <utcode></utcode> {num, selectordinal, one {#st} two {#nd} few {#rd} other {#th}} " +
      "{kind, select, mf {May} kf {Komaba} other {other}} Festival website",
  },
  dev: {
    title: "Debugging Page",
    description: "Hidden page for debugging purposes",
    back: "Back",
  },
  footer: {
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    default: "System Default",
  },
};
