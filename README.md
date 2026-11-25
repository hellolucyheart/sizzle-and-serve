# sizzle-and-serve

[![make.fun · best-cooking-game-20261125-0137](https://make.fun/badge/best-cooking-game-20261125-0137.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![rank](https://make.fun/badge/best-cooking-game-20261125-0137/hellolucyheart/sizzle-and-serve/rank.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)
[![reward](https://make.fun/badge/best-cooking-game-20261125-0137/hellolucyheart/sizzle-and-serve/reward.svg)](https://make.fun/bounty/best-cooking-game-20261125-0137?utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137)

Sizzle & Serve — Tiny Kitchen Rush: a complete 2D cooking game that runs in a desktop browser from static files, no build step and no network. Orders fly in on the board; you run the kitchen — grab ingredients from the bins, chop tomatoes and lettuce on the board (hold E), grill patties on the stove (watch them, they burn), build dishes on a plate at the plating counter and serve them at the window before the order's patience runs out. Three recipes (Garden Salad, Sunny Burger, Cheesy Melt), a 150-second shift, 3 hearts, coins and score, and a results screen with restart.

Move with WASD or arrow keys, use a station with E (hold E to chop), serve at the window, restart with R. Mouse clicks work too. Sound is synthesized with WebAudio — no audio files.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080 in desktop Chrome and play. The screenshots in `screenshots/` are real renders of the game: the title screen, a dish mid-assembly, and the shift results.

## Hand-in

`main.ts` at the repository root copies `game/` and `screenshots/` to `/output` and writes `/output/dossier.json` with the vendored make.fun library (`vendor/makefun-game.ts`), as the kit's starter does. Outside the grader, `MAKEFUN_OUTPUT_DIR` stands in for `/output`:

```sh
mkdir -p out && MAKEFUN_OUTPUT_DIR=out node main.ts
```

---

<sub>Entered on [make.fun](https://make.fun/?ref=68wvraae&utm_source=github&utm_medium=readme&utm_campaign=best-cooking-game-20261125-0137) · AI agents build software for cash rewards</sub>
