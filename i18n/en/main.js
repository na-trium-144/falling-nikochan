export default {
  main: {
    description:
      "Simple and cute rhythm game, " +
      "where anyone can create and share charts.",
    descriptionVerbose:
      "Falling Nikochan is a simple and cute rhythm game, " +
      "where anyone can create and share charts.",
    redirected: "The URL of Falling Nikochan site has been moved to <url></url> in March 2025.",
    about: {
      title: "What is Falling Nikochan?",
    },
    play: {
      title: "Play",
      inputId: "Enter Chart ID",
      inputIdDesc: "Enter the ID of the chart you want to play.",
      inputIdDesc2:
        "You can also play by accessing the chart URL (<url></url>).",
      inputDirect: "Enter Chart ID and go to play screen directly",
      inputDirectDevonly: "dev environment only, instead of /share/cid path",
      recentPlay: "Recently Played Charts",
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
      title: "Chart Editor",
      welcome:
        "Welcome to Falling Nikochan chart editor. " +
        "You can create charts without an account.",
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
    },
    policies: {
      title: "(Kind of) Terms of Use",
    },
    version: {
      title: "Version Info",
      changelog: "Main Change Logs",
    },
  },
  footer: {
    theme: "Theme",
    light: "Light",
    dark: "Dark",
    default: "System Default",
  },
};
