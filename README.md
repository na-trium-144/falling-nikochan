# Falling Nikochan

[![Production Version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fnikochan.utcode.net%2FbuildVer.json&query=%24.version&prefix=v&label=Prod&color=%23b8f6fe)](https://nikochan.utcode.net)
[![Staging Version](https://img.shields.io/badge/dynamic/json?url=https%3A%2F%2Fnikochan-staging.utcode.net%2FbuildVer.json&query=%24.version&prefix=v&label=Staging&color=%23441306)](https://nikochan-staging.utcode.net)
[![GitHub License](https://img.shields.io/github/license/na-trium-144/falling-nikochan)](./LICENSE)

[![YouTube Channel Subscribers](https://img.shields.io/youtube/channel/subscribers/UChAEFwUtjsbWmWwZSxYLXWQ?label=%40nikochan144)](https://www.youtube.com/@nikochan144)
[![Twitter Follow](https://img.shields.io/twitter/follow/nikochan144)](https://x.com/nikochan144)

* Simple and cute rhythm game. Playable on web browsers such as PC, tablet, and smartphone.
* Anyone can create a chart without any account registration or login. Share the chart ID on SNS to let others play.
* Uses YouTube embed as audio source.

For more information, play, and chart creation, please visit the Falling Nikochan top page: https://nikochan.utcode.net .

> * シンプルでかわいい音ゲーです。PC、タブレット、スマートフォンなどのブラウザーで手軽に遊べます。
> * さらに、アカウント登録やログイン不要で誰でも譜面を作成でき、SNSなどで譜面IDを共有することで他の人に遊んでもらうことができます。
> * 音源としてYouTube埋め込みを利用しています。
>
> 遊び方などの説明、プレイ、譜面作成 は、Falling Nikochan トップページからどうぞ: https://nikochan.utcode.net

<img src="https://github.com/na-trium-144/falling-nikochan/blob/main/.github/screenshot_15.jpg?raw=true" width=960 />

## Development

See [CONTRIBUTING.md](CONTRIBUTING.md) for the full development setup guide, project structure, conventions, and how to open a pull request.

## API

The code for the backend is in the [route/](route/) directory, NOT in the [api/](api/) directory.

API Reference is here: https://nikochan.utcode.net/api

See also [chart/src/chart.ts](chart/src/chart.ts) for relations among the chart data formats.

## Localization

[i18n/](i18n/) directory contains the translations of the application.

To add a new language, create a new directory with the language code and add all the translations in the corresponding files.

See also [next-intl Usage guide](https://next-intl.dev/docs/usage/messages)

## Versioning

* major version follows the Chart data format version.
* minor version is increased with `node ./versionBump.js minor` for each PR
    * Changes that do not so much affect app/ such as dependabot or update README.md or minor fixes are not counted.
* ChangeLogs are written in [i18n/[locale]/changelog.mdx](i18n/ja/changelog.mdx) for user-friendly explanation and in [CHANGELOG_dev.md](CHANGELOG_dev.md) for more detailed explanation. I may not update the information if the changes are minor.
<details><summary>When bumping major version</summary>

* Create new file in chart/src/legacy/
    * Parts of the schema that remain unchanged do not need to be duplicated; they can be imported from the previous version.
* Update chart/src/index.ts so it can import the new file in legacy/.
* Update type aliases, currentChartVer, convertToPlay, convertToLatest etc. in chart/src/chart.ts
* In route/src/api/chart.ts,
    * Update the ChartEntry and ChartEntryCompressed type to support the new version.
    * Update chartToEntry function to support the last 2 versions.
    * Update entryToChart function to support the new version.
* Update route/src/api/chartFile.ts, newChartFile.ts, playFile.ts and seqPreview.ts to support the last 2 versions, including the OpenAPI documentation (describeRoute).
* Fix any typecheck and lint errors.
    * Statements like `currentChartVer satisfies 15;` indicates that not only that statement but also the surrounding code needs to be updated when the version changes.
* Release new version of fn-commands library

</details>

## License

This project is licensed under the GNU Affero General Public License v3.0 or later (AGPL-3.0-or-later), with the exception of the assets located in the `frontend/public/assets/` directory.
The full text of the AGPL-3.0 license can be found in the [LICENSE](LICENSE) file.

The use of Falling Nikochan's API and embedding it in an iframe are exempt from AGPL-3.0-or-later and can be done freely.
The OpenAPI Specification of the API ([/api/openapi.json](https://nikochan.utcode.net/api/openapi.json)) is licensed under the MIT License.

The assets in `frontend/public/assets/` (including images, sounds, etc.) are licensed under the Creative Commons Attribution 4.0 International (CC-BY-4.0) license.
The full text of the CC-BY-4.0 license for assets can be found in the [frontend/public/assets/LICENSE](frontend/public/assets/LICENSE) file.

Copyright (c) 2024-2026 [@na-trium-144](https://github.com/na-trium-144) (and contributors)

Note: [ver13.22](https://github.com/na-trium-144/falling-nikochan/tree/v13) is the last version licensed under MIT License.
