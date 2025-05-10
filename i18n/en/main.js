export default {
  main: {
    description:
      "Simple and cute rhythm game, " +
      "where anyone can create and share charts.",
    descriptionVerbose:
      "Falling Nikochan is a simple and cute rhythm game, " +
      "where anyone can create and share charts.",
    redirected:
      "The URL of Falling Nikochan site has been moved to <url></url> in March 2025.",
    pwa: {
      installWithPrompt:
        "For a more comfortable full-screen experience, " +
        "add Falling Nikochan to your home screen and launch it as an app.",
      install: "Add to Home Screen",
      installWithoutPrompt:
        "For a more comfortable full-screen experience, " +
        'select "Add to home screen" from your browser\'s menu and launch it as an app.',
      installIOS:
        "For a more comfortable full-screen experience, " +
        'select "Add to home screen" from Safari\'s share menu and launch it as an app.',
      dismiss: "Not now",
      updating: "Downloading update...",
      updateDone: "Update completed!",
      updateFailed: "Update failed...",
    },
    inputId: "Enter Chart ID",
    inputIdDesc: "Enter the ID of the chart you want to play.",
    inputIdDesc2: "You can also play by accessing the chart URL (<url></url>).",
    inputDirect: "Enter Chart ID and go to play screen directly",
    inputDirectDevonly: "dev environment only, instead of /share/cid path",
    about: {
      title: "What is Falling Nikochan?",
    },
    top: {
      titleShort: "Home",
    },
    play: {
      title: "Play with Public Charts",
      titleShort: "Play",
      description:
        "You can find songs from popular charts / latest charts / sample charts.",
      search: "Search",
      searchDesc: "Search by song title, composer, chart creator, etc.",
      searchTitle: "Search results for {search}",
      recent: "Recently Played Charts",
      popular: "Popular Charts",
      popularDesc: "Charts played many times in the last {popularDays} days.",
      latest: "Latest Charts",
      latestDesc: "List of charts recently created or updated.",
      latestDesc2:
        "For chart creators: Check 'Publish this chart' in chart editor to reflect here after a few minutes.",
      sample: "Sample Charts",
      sampleDesc:
        "Charts created by Falling Nikochan author <small>(na-trium-144)</small>. Start here if you are new. ",
      sampleDesc2:
        "Also, more charts are available on Falling Nikochan's YouTube channel <youtube>@nikochan144</youtube>.",
      sampleDevonly:
        "In dev environment, dummy files with only title and composer are displayed.",
    },
    edit: {
      title: "Create a Chart",
      titleShort: "Create",
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
    },
    chartList: {
      showAll: "Show More",
      empty: "No charts yet",
      notFound: "No charts found",
    },
    policies: {
      title: "(Kind of) Terms of Use",
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
    },
    links: {
      title: "Contact and Other Links",
      titleShort: "other",
      description: "Contact and other links of Falling Nikochan.",
      about: "About Falling Nikochan",
      supportedBrowsers:
        "Supported browsers are {browserslist}. " +
        "Some parts may not function or display properly in earlier versions.",
      version: "Version Info",
      changelog: "Changelogs here",
      policies: "(Kind of) Terms of Use",
      settings: "Settings",
      theme: "Theme",
      light: "Light",
      dark: "Dark",
      default: "System Default",
      contactForm: "Contact Form",
      officialChannel: "Falling Nikochan Official Channel (@nikochan144)",
      officialChannelShort: "Official Channel",
    },
  },
  footer: {
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    default: "System Default",
  },
};
