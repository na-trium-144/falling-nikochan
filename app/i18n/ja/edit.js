export default {
  edit: {
    title: "譜面編集",
    help: "ヘルプ",
    enterPasswd: "編集用パスワードを入力してください。",
    passwdFailed: "パスワードが違います。",
    submitPasswd: "進む",
    savePasswd: "パスワードを保存",
    bypassPasswd: "パスワード入力をスキップ (dev環境限定)",
    confirmUnsaved: "未保存の変更があります",
    touchMode:
      "タッチ操作モード: {mode, select, p {x 移動} v {vx, vy 移動} other {オフ}}",
    playerControl: "動画の操作",
    playerControls: {
      play: "再生",
      pause: "停止",
      moveStep: "{step, number, ::+!} ステップ",
      moveMinus1F: "-1/30 秒",
      movePlus1F: "+1/30 秒",
    },
    stepUnit: "1 ステップ",
    stepUnitHelp:
      "音符間隔を設定できます。<br></br>" +
      "例えば 1 / 4 なら 4 分音符1つぶんです。<br></br>" +
      "上部の「-1 ステップ」「+1 ステップ」を押したとき<br></br>" +
      "時間が戻る・進む量が変わります。<br></br>" +
      "すでに置かれている音符には影響しません。<br></br>" +
      "現在は 1 / (4の倍数) のみが使用できます。<br></br>" +
      "3連符は 1 / 12 や 1 / 24、5連符は 1 / 20 などとします。",
    zoom: "拡大",
    timeBar: {
      bpm: "BPM",
      speed: "速度",
      beat: "拍子",
    },
    meta: {
      title: "メタ",
      youtubeId: "YouTube URL または動画ID",
      youtubeIdHelp:
        "譜面で使用する楽曲を指定してください。<br></br>" +
        "入力した動画が左上の枠内に表示されます。",
      musicInfo: "楽曲情報",
      musicTitle: "楽曲タイトル",
      musicComposer: "作曲者など",
      chartCreator: "譜面作成者(あなたの名前)",
      passwd: "編集用パスワード",
      passwdHelp:
        "次回からこの譜面を編集する際に必要な<br></br>" +
        "パスワードを設定することができます。<br></br>" +
        "これを設定しないと、譜面IDを知っている人が<br></br>" +
        "誰でもこの譜面を編集できてしまいます。<br></br>" +
        "パスワードを忘れた場合復元する方法はないので<br></br>" +
        "注意してください。",
      displayPasswd: "表示",
      savePasswd: "パスワードを保存",
      savePasswdHelp:
        "パスワードをこのブラウザ (の Local Storage) に保存し、<br></br>" +
        "このブラウザからは次回パスワードを<br></br>" +
        "入力しなくても編集できるようになります。",
      publish: "この譜面を一般公開する",
      publishHelp:
        "Falling Nikochan トップページの<br></br>" +
        "譜面リストに載せることができ、<br></br>" +
        "より多くの人にプレイしてもらうことができます。",
      publishFail: {
        noId: "(YouTube 動画IDが未指定のため一般公開できません)",
        empty:
          "(譜面データがすべて空または非表示になっているため一般公開できません)",
        noPasswd: "(編集用パスワードが未設定のため一般公開できません)",
      },
      saveDone: "保存しました！",
      loadFail: "ファイルの読み込みに失敗しました",
      confirmLoad: "このファイルで譜面データを上書きしますか?",
      fileSize: "現在のファイルサイズ",
      fileSizeMax: "(最大 {max} kB まで)",
      testPlay: "テストプレイ",
      testPlayHelp:
        "ブラウザーの新しいタブで<br></br>" +
        "現在の譜面をプレイする画面が開きます。<br></br>" +
        "オートプレイを見ることも自分でプレイすることもできます。",
      chartId: "譜面ID",
      unsaved: "(未保存)",
      saveToServer: "サーバーに保存",
      saveToServerHelp:
        "まだ1度も保存していない新規譜面の場合、<br></br>" +
        "保存することでランダムな6桁の譜面IDが割り振られます。<br></br>" +
        "すでに1度保存しIDが割り振られている場合、<br></br>" +
        "上書きは何回でもできます。",
      hasUnsaved: "(未保存の変更があります)",
      convertingWarning:
        "この譜面は旧バージョンのフォーマット (ver.{ver}) から変換されており、一部の音符の挙動が変わっている可能性があります。保存すると変換後の譜面データで上書きされます。(詳細はトップページ下部の更新履歴を確認してください。)",
      shareLink: "共有用リンク",
      copy: "コピー",
      localSaveLoad: "ローカルに保存/読み込み",
      localSaveLoadHelp:
        "現在の譜面をあなたの端末上に保存・読み込みできます。<br></br>" +
        "保存時のファイル形式は 〜.{extension} ですが、<br></br>" +
        "旧バージョンのファイルの読み込みにも対応しています。<br></br>" +
        "保存したファイルにはパスワードはかかっていません。",
      saveToLocal: "保存",
      loadFromLocal: "ファイルを開く",
    },
    timing: {
      title: "タイミング",
      offset: "オフセット",
      offsetSecond: "秒",
      offsetHelp:
        "1小節目の1拍目が始まる位置(動画内の秒数)を指定してください。<br></br>" +
        "動画の音声データの波形を表示する機能などは用意していないので、<br></br>" +
        "スロー再生やコマ送り等も使ってがんばって合わせてください。",
      step: "ステップ",
      stepHelp:
        "拍数単位の時間は「小節数; 拍数 + 分数」で表されます。<br></br>" +
        "1 拍 の長さは拍子の設定で変わります。<br></br>" +
        "(デフォルトでは4分音符単位です。)",
      bpm: "BPM",
      bpmHelp:
        "音源のBPMを指定してください。<br></br>" +
        "BPMは拍子の設定にかかわらず、1分間あたりの4分音符の個数で指定します。<br></br>" +
        "途中でBPMを変化させたい場合は「ここで変化」にチェックを入れると<br></br>" +
        "現在のカーソル位置にBPM変化が挿入されます。",
      speed: "速度",
      speedHelp1:
        "ニコチャンの降ってくる速さ(重力？)を設定できます。<br></br>" +
        "特にこだわりがなければBPMと同じにしておくとよいです。<br></br>" +
        "途中で速度を変化させたい場合は「ここで変化」にチェックを入れると、<br></br>" +
        "現在のカーソル位置に速度変化が挿入されます。",
      speedHelp2:
        "現在の仕様としては速度変化をさせると画面上のすべての音符が<br></br>" +
        "突然加速したり減速したりする挙動になっています。",
      speedHelp3:
        "0 (音符が停止する) やマイナスの値 (音符が逆に上がっていく) も使えます。<br></br>" +
        "いじりすぎるとクソゲーになるので注意。",
      beat: "拍子",
      beatOffset: "オフセット",
      beatHelp1:
        "拍子を設定できます。4 / 4 でよければ特にいじる必要はないです。<br></br>" +
        "途中で拍子を変化させたい場合は「ここで変化」にチェックを入れると<br></br>" +
        "その位置から拍子が変化します。",
      beatHelp2:
        "オフセットは通常は 0 / 4 のままでよいですが、<br></br>" +
        "指定すると拍子の途中から始めることができます。<br></br>" +
        "例えば Offset を 2 / 4 にすると、<br></br>" +
        "4分音符2拍分を飛ばして、3拍目からカウントが始まります。",
      beatBarHelp1:
        "拍子の分母には 4, 8, 16 のいずれかのみが使用できます。<br></br>" +
        "指定した拍子の数だけ <slime>4</slime>(4分音符)、<slime>8</slime>(8分音符)、<slime>16</slime>(16分音符)<br></br>" +
        "が表示されます。 (プレイ時と同様右から左にカウントします。)",
      beatBarHelp2:
        "<slime>4</slime> をクリックするとサイズを変更することができます。<br></br>" +
        "例えば 7 / 8 拍子ならデフォルトでは <slime>8</slime><slime>4</slime><slime>4</slime><slime>4</slime> となっていますが、<br></br>" +
        "楽曲のリズムにあわせて <slime>4</slime><slime>4</slime><slime>8</slime><slime>4</slime> などのように<br></br>" +
        "変更することもできます。",
      beatBarHelp3:
        "<add></add> をクリックすると、拍子の表示が1段増えます。<br></br>" +
        "例えば 7 / 4 などのように大きい拍子は、<br></br>" +
        "4 / 4 + 3 / 4 のように分けて指定するとよいです。",
      changeHere: "ここで変化",
      editedInCode: "Code タブで編集されているため変更できません。",
    },
    level: {
      title: "レベル",
      levelsList: "レベル",
      levelAdd: "追加",
      levelDuplicate: "コピーを作成",
      levelDelete: "削除",
      unlisted: "(非表示)",
      levelName: "レベル名",
      difficulty: "難易度",
      unlistLevel: "このレベルを非表示にする",
      unlistHelp:
        "共有用リンクや譜面IDからこの譜面をプレイしようとした時に<br></br>" +
        "このレベルは表示されなくなります。<br></br>" +
        "未完成の譜面を隠しておきながら<br></br>" +
        "完成したレベルだけ公開したい時などに使えます。",
    },
    note: {
      title: "音符",
      step: "ステップ",
      noteNum: "音符数",
      noteAdd: "追加",
      noteDelete: "削除",
      totalNotes: "全体の音符数",
      copy: "コピー",
      paste: "貼り付け",
      position: "位置",
      positionHelp:
        "x は音符を最終的に叩く位置です。<br></br>" +
        "-5 (左端) 〜 5 (右端)の値が設定できます。<br></br>" +
        "(デフォルトは -3)",
      velocity: "速度",
      velocityHelp1:
        "vx, vy は音符が飛んでくる速度です。<br></br>" +
        "(デフォルトは 1, 3)<br></br>" +
        "左に表示されている音符の軌道を<br></br>" +
        "見ながら編集しましょう。<br></br>" +
        "いじりすぎるとクソゲーになるので注意",
      velocityHelp2:
        "|v| は音符の速度の絶対値、 angle は角度です。<br></br>" +
        "こちらを変更した場合も vx, vy に反映されます。",
      big: "Big (大きい音符)",
      fallMode: "音符の出現位置",
      fallModeFalse: "下から",
      fallModeTrue: "上から",
      fallModeHelp:
        "「上から」にすると音符は<br></br>" +
        "画面上側から降ってくるのみになり、<br></br>" +
        "「下から」にすると画面下側から<br></br>" +
        "投げ上げるような形になります。",
      editedInCode: "Code タブで編集されているため変更できません。",
    },
    code: {
      title: "コード",
    },
    guide: {
      titles: {
        1: "譜面編集 ヘルプ",
        2: "メタ情報タブ",
        3: "タイムバー",
        4: "タイミングタブ",
        5: "レベルタブ",
        6: "音符タブ",
        7: "コードタブ",
      },
      close: "閉じる",
    },
  },
};
