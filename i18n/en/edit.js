export default {
  edit: {
    title: "Chart Editor - {title} (ID: {cid})",
    titleShort: "Chart Editor",
    description: "Falling Nikochan Chart Editor",
    help: "Help",
    chartId: "Chart ID",
    enterPasswd: "Enter the password to edit.",
    passwdFailed: "Password is incorrect.",
    submitPasswd: "Go",
    savePasswd: "Save password",
    bypassPasswd: "Skip password input (dev only)",
    confirmUnsaved: "There are unsaved changes.",
    touchMode:
      "Touch mode: {mode, select, p {Move x} v {Move vx, vy} other {Off}}",
    playerControl: "Player controls",
    playerControls: {
      play: "Play",
      pause: "Pause",
      moveStep: "{step, number, ::+!} {step, plural, =1 {step} other {steps}}",
      moveMinus1F: "-1/30 sec",
      movePlus1F: "+1/30 sec",
    },
    stepUnit: "1 step",
    stepUnitHelp:
      "You can set the note interval.<br></br>" +
      "For example, 1 / 4 is one quarter note.<br></br>" +
      "The amount of time to rewind or fast forward <br></br>" +
      'when you press "-1 step" or "+1 step" at the top changes by this.<br></br>' +
      "It does not affect notes that are already placed.<br></br>" +
      "Currently, only 1 / (multiple of 4) can be used.<br></br>" +
      "Use 1 / 12 or 1 / 24 for triplets, 1 / 20 for quintuplets, etc.",
    zoom: "Zoom",
    running: "Running the script...",
    cancel: "Cancel",
    timeBar: {
      bpm: "BPM",
      speed: "Speed",
      beat: "Beat",
    },
    meta: {
      title: "Meta",
      youtubeId: "YouTube URL or video ID",
      youtubeIdHelp:
        "Specify the song to be used in the chart.<br></br>" +
        "The input video will be displayed in the top left frame.",
      musicInfo: "Song info",
      musicTitle: "Song title",
      musicComposer: "Composer, etc.",
      chartCreator: "Chart creator (your name)",
      passwd: "Change password",
      passwdHelp:
        "You can set a password that is <br></br>" +
        "required to edit this chart next time.<br></br>" +
        "If left blank, it will not be changed from the current password.<br></br>" +
        "Be careful because there is no way to <br></br>" +
        "restore the password if you forget it.",
      displayPasswd: "Show",
      savePasswd: "Save password",
      savePasswdHelp:
        "Save the password in this browser's Local Storage, <br></br>" +
        "so you can edit without entering the password <br></br>" +
        "next time from this browser.",
      publish: "Publish this chart",
      publishHelp:
        "You can list this chart on the <br></br>" +
        "Falling Nikochan top page and <br></br>" +
        "get more people to play it.",
      publishFail: {
        noId: "(Cannot publish because YouTube video ID is not specified)",
        empty: "(Cannot publish because all chart data is empty or hidden)",
      },
      saveFail: {
        noId: "YouTube video ID is not specified",
        noPasswd: "Password is not set",
      },
      saveDone: "Saved!",
      loadFail: "Failed to load file",
      confirmLoad: "Overwrite the chart data with this file?",
      eventNum: "Number of events",
      eventNumHelp:
        "The total number of notes, rests, BPM changes, <br></br>" +
        "speed changes, and time signature changes in the chart.",
      testPlay: "Test play",
      testPlayHelp:
        "Opens a new tab in your browser <br></br>" +
        "to play the current chart.<br></br>" +
        "You can watch the autoplay or play it yourself.",
      chartId: "Chart ID",
      unsaved: "(Unsaved)",
      saveToServer: "Save to server",
      saveToServerHelp:
        "For new charts that have not been saved yet, <br></br>" +
        "a random 6-digit chart ID will be assigned by saving. <br></br>" +
        "You can overwrite as many times as you like <br></br>" +
        "if it is already been saved and assigned an ID.",
      hasUnsaved: "(There are unsaved changes)",
      deleteFromServer: "Delete this chart from server",
      confirmDelete:
        // \n for confirm() dialog
        "Are you sure you want to delete this chart? \n" +
        "This action cannot be undone.\n\n" +
        "Type {cid} to confirm deletion.",
      // converting:
      //   "This chart has been converted from the old format (ver.{ver}), " +
      //   "and saving will overwrite the previous chart data with the converted data.",
      convertingIncompatible:
        "This chart has been converted from the old format (ver.{ver}), " +
        "and some notes may behave differently. " +
        "Saving will overwrite the previous chart data with the converted data. " +
        "(For details, please check the update history at the bottom of the top page.)",
      shareLink: "Share link",
      copy: "Copy",
      share: "Share",
      localSaveLoad: "Save/load locally",
      localSaveLoadHelp:
        "You can save/load the current chart on your device.<br></br>" +
        "The file format when saving is 〜.{extension}, <br></br>" +
        "but it also supports loading old version files.<br></br>" +
        "The saved file is not password protected.",
      saveToLocal: "Save",
      loadFromLocal: "Open file",
    },
    timing: {
      title: "Timing",
      offset: "Offset",
      offsetSecond: "sec",
      offsetHelp:
        "Specify the position (seconds in the video) <br></br>" +
        "where the first beat of the first measure starts.<br></br>" +
        "There is no function to display the waveform of <br></br>" +
        "the audio data of the video, so please adjust it by <br></br>" +
        "using slow playback or frame advance, etc.",
      ytBegin: "Video start",
      ytEnd: "Video end",
      ytEndAuto: "Last note",
      ytEndFull: "End of video",
      ytEndAt: "Manual setting",
      ytBeginHelp:
        "You can cut the intro of the video <br></br>" +
        "by specifying the start position of the video.",
      ytEndHelp:
        "You can specify whether to stop the video when the chart ends,<br></br>" +
        "or to play the video to the end before ending it.",
      step: "Step",
      stepHelp:
        'Time in beats is expressed as "bars; beats + fractions".<br></br>' +
        "The length of one beat depends on the time signature.<br></br>" +
        "(The default is quarter notes.)",
      bpm: "BPM",
      bpmHelp:
        "Specify the BPM of the audio.<br></br>" +
        "BPM is the number of quarter notes per minute, <br></br>" +
        "regardless of the time signature.<br></br>" +
        "If you want to change the BPM during the song, <br></br>" +
        'check "Change here" to insert <br></br>' +
        "a BPM change at the current cursor position.",
      speed: "Speed",
      speedHelp1:
        "You can set the speed (gravity?) at which Nikochan falls.<br></br>" +
        "If you don't have any particular preferences, <br></br>" +
        "it's a good idea to keep it the same as the BPM.<br></br>" +
        "If you want to change the speed during the song, <br></br>" +
        'check "Change here" to insert <br></br>' +
        "a speed change at the current cursor position.",
      speedHelp2:
        "Currently, if you change the speed, all notes <br></br>" +
        "on the screen will suddenly accelerate or decelerate.",
      speedHelp3:
        "You can also use 0 (notes stop) or <br></br>" +
        "negative values (notes go up).<br></br>" +
        "Be careful not to mess with it too much, <br></br>" +
        "or it will become a crappy chart.",
      beat: "Beat",
      beatOffset: "Offset",
      beatHelp1:
        "You can set the time signature.<br></br>" +
        "If 4/4 is fine, you don't need to change it.<br></br>" +
        "If you want to change the time signature during the song, <br></br>" +
        'check "Change here" to change <br></br>' +
        "the time signature from that position.",
      beatHelp2:
        "The offset is usually 0/4, <br></br>" +
        "but you can start from the middle of the time signature.<br></br>" +
        "For example, if you set the Offset to 2/4, <br></br>" +
        "the count starts from the third beat, skipping two quarter notes.",
      beatBarHelp1:
        "Only 4, 8, or 16 can be used <br></br>" +
        "as the denominator of the time signature.<br></br>" +
        "As many <slime>4</slime> (quarter notes), <slime>8</slime> (eighth notes), <br></br>" +
        "<slime>16</slime> (sixteenth notes) as specified <br></br>" +
        "in the time signature will be displayed. <br></br>" +
        "(The count goes from right to left.)",
      beatBarHelp2:
        "Click <slime>4</slime> to change the size.<br></br>" +
        "For example, if the time signature is 7/8, <br></br>" +
        "the default is <slime>8</slime><slime>4</slime><slime>4</slime><slime>4</slime>, <br></br>" +
        "but you can change it to <slime>4</slime><slime>4</slime><slime>8</slime><slime>4</slime> <br></br>" +
        "to match the rhythm of the song.",
      beatBarHelp3:
        "Click <add></add> to add a new bar.<br></br>" +
        "For example, for a large time signature like 7/4, <br></br>" +
        "it is recommended to specify it as 4/4 + 3/4 <br></br>" +
        "to divide it.",
      changeHere: "Change here",
      editedInCode: "Cannot be changed because it is edited in the Code tab.",
      se: "Tap sound",
    },
    level: {
      title: "Levels",
      levelsList: "Levels",
      levelAdd: "Add",
      levelDuplicate: "Duplicate",
      levelDelete: "Delete",
      deleteConfirm:
        "Are you sure you want to delete this level?\nThis action cannot be undone.",
      unlisted: "(Unlisted)",
      levelName: "Level name",
      difficulty: "Difficulty",
      unlistLevel: "Hide this level",
      unlistHelp:
        "When you try to play this score <br></br>" +
        "using the shared link or score ID,<br></br>" +
        " this level will not be displayed. <br></br>" +
        "You can use this when you want to <br></br>" +
        "hide unfinished scores and <br></br>" +
        "publish only the completed levels.",
    },
    note: {
      title: "Notes",
      step: "Step",
      noteNum: "Note",
      noteAdd: "Add",
      noteDelete: "Delete",
      totalNotes: "Total Notes",
      copy: "Copy",
      paste: "Paste",
      position: "Position",
      positionHelp:
        "x is the final position to hit the note.<br></br>" +
        "Values from -5 (left) to 5 (right) can be set.<br></br>" +
        "(Default is -3)",
      velocity: "Velocity",
      velocityHelp1:
        "vx, vy are the speed at which the notes fall.<br></br>" +
        "(Default is 1, 3)<br></br>" +
        "Edit while watching the trajectory <br></br>" +
        "of the notes displayed on the left.<br></br>" +
        "Be careful not to mess with it too much, <br></br>" +
        "or it will become a crappy chart.",
      velocityHelp2:
        "Currently, if you change the speed, <br></br>" +
        "all notes on the screen will <br></br>" +
        "suddenly accelerate or decelerate.",
      big: "Big",
      fallMode: "Note appearance",
      fallModeFalse: "from bottom",
      fallModeTrue: "from top",
      fallModeHelp:
        'If set to "from top", notes will <br></br>' +
        "only fall from the top of the screen, <br></br>" +
        'and if set to "from bottom", <br></br>' +
        "they will be thrown up from the bottom.",
      editedInCode: "Cannot be changed because it is edited in the Code tab.",
    },
    code: {
      title: "Code",
      currentLine: "Line corresponding to the current position ({step})",
    },
    guide: {
      titles: {
        1: "Chart Editor Help",
        2: "Meta Information Tab",
        3: "Time Bar",
        4: "Timing Tab",
        5: "Levels Tab",
        6: "Notes Tab",
        7: "Code Tab",
      },
      agreeClose: "Agree to the terms and close",
      close: "Close",
    },
  },
};
