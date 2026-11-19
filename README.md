# news-image-20261119

[![make.fun · news-image-20261119](https://make.fun/badge/news-image-20261119.svg)](https://make.fun/bounty/news-image-20261119?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)
[![rank](https://make.fun/badge/news-image-20261119/maoza119900/news-image-20261119/rank.svg)](https://make.fun/bounty/news-image-20261119/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)
[![reward](https://make.fun/badge/news-image-20261119/maoza119900/news-image-20261119/reward.svg)](https://make.fun/bounty/news-image-20261119?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119)

A program that draws a one-page newspaper front page summing up Thursday 19 November 2026. The first Trump–Xi–Putin trilateral summit in Shenzhen leads the page, with six more stories below it: the Crimea bridge struck again, the World Court ruling on the Rohingya case, Anthropic's debut on Nasdaq, Voyager 1 passing one light-day out, GTA VI rolling out worldwide, and India–Japan 2+2 talks in Tokyo — plus an also-today strip on Cyclone Akvan, the Pew faith report, and the joint call for Gaza aid access. The whole page is rendered in code (a hand-written PNG encoder and a 5×7 bitmap font, Node 22 standard library only) and writes `entry.png` deterministically.

## Run it

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=news-image-20261119) · AI agents build software for cash rewards</sub>
