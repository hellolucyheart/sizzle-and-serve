// The screenshot scenes behind ?shot=start|play|end. Each one plays the real
// rules forward from a fresh world for a fixed number of steps, steered by a
// small scripted cook that walks to stations and uses them, so every frame is
// what a short game really looks like and the same seed always gives the
// same frame. No state is faked: the cook only presses the same inputs a
// player would.
import { STEP, STATIONS } from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, createWorld, resetWorld, startGame, stepWorld } from './world.js';

const START_SECONDS = 5;
const MAX_PLAY_SECONDS = 120;
const SAMPLE = STEP;

function blankInput() {
  return { moveX: 0, moveY: 0, use: false, usePressed: false, restartPressed: false, startPressed: false, mouse: { x: 0, y: 0, clicked: false } };
}

// One step of the scripted cook. `tasks` is a list of jobs; the cook walks to
// the job's station, then uses it, then moves on. Returns true when the list
// is done.
function driveCook(world, tasks, cursor) {
  const input = blankInput();
  if (cursor.index >= tasks.length) return { input, done: true };
  const task = tasks[cursor.index];
  const chef = world.chef;

  if (task.wait) {
    if (task.wait(world)) cursor.index += 1;
    return { input, done: cursor.index >= tasks.length };
  }

  const station = task.station;
  const dx = station.at.x - chef.x;
  const dy = station.at.y - chef.y;
  const distance = Math.hypot(dx, dy);
  if (distance > 42) {
    input.moveX = dx / distance;
    input.moveY = dy / distance;
    return { input, done: false };
  }
  if (task.hold) {
    input.use = true;
    if (task.until(world)) cursor.index += 1;
    return { input, done: cursor.index >= tasks.length };
  }
  input.usePressed = true;
  cursor.index += 1;
  return { input, done: cursor.index >= tasks.length };
}

function worldStation(id) {
  return STATIONS.find((station) => station.id === id);
}

// The cook's plan for a Sunny Burger: plate, bread, grilled patty, chopped
// lettuce, all assembled on the plating counter.
function burgerPlan(world) {
  const at = (id) => worldStation(id);
  return [
    { station: at('plates') },
    { station: at('plating') },
    { station: at('bin-bread') },
    { station: at('plating') },
    { station: at('bin-patty') },
    { station: at('grill') },
    { wait: (w) => w.grill.state === 'done' || w.grill.state === 'burnt' },
    { station: at('grill') },
    { station: at('plating') },
    { station: at('bin-lettuce') },
    { station: at('board') },
    { station: at('board'), hold: true, until: (w) => w.board.item === 'lettuce-chopped' },
    { station: at('board') },
    { station: at('plating') },
  ];
}

/**
 * Set `world` to the named scene (start, play or end; any other name is start)
 * and return the screen to draw over it.
 */
export function stageShot(name, world) {
  resetWorld(world);
  if (name !== 'play' && name !== 'end') {
    world.screen = SCREEN_TITLE;
    for (let index = 0; index < START_SECONDS / SAMPLE; index += 1) {
      stepWorld(world, SAMPLE, blankInput());
    }
    return { screen: SCREEN_TITLE };
  }

  startGame(world);
  const tasks = burgerPlan(world);
  const cursor = { index: 0 };
  let served = false;
  for (let index = 0; index < MAX_PLAY_SECONDS / SAMPLE; index += 1) {
    const { input, done } = driveCook(world, tasks, cursor);
    stepWorld(world, SAMPLE, input);
    if (world.screen === SCREEN_OVER) break;
    if (done) break;
  }

  if (name === 'end') {
    // Pick the finished plate up, serve it at the window, then let the shift
    // run out so the results screen is real.
    const serveTasks = [
      { station: worldStation('plating') },
      { station: worldStation('window') },
    ];
    const serveCursor = { index: 0 };
    for (let index = 0; index < 30 / SAMPLE; index += 1) {
      const { input, done } = driveCook(world, serveTasks, serveCursor);
      stepWorld(world, SAMPLE, input);
      if (world.screen === SCREEN_OVER) break;
      if (done) { served = true; break; }
    }
    for (let index = 0; index < 400 / SAMPLE; index += 1) {
      if (world.screen === SCREEN_OVER) break;
      stepWorld(world, SAMPLE, blankInput());
    }
    return { screen: SCREEN_OVER, served };
  }

  return { screen: world.screen === SCREEN_OVER ? SCREEN_OVER : SCREEN_PLAY, served };
}

export function createShotWorld(seed = 1) {
  return createWorld(seed);
}
