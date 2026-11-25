// Entry point: boots the canvas, runs the fixed-step loop, and handles the
// ?shot=start|play|end&seed=1 screenshot mode, which renders one deterministic
// frame and stops. Played live, the game starts on Enter or a click.
import { STEP, VIEW } from './config.js';
import { createInput } from './input.js';
import { drawWorld } from './render.js';
import { createShotWorld, stageShot } from './shots.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, createWorld, startGame, stepWorld } from './world.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW.width;
canvas.height = VIEW.height;
const statusLine = document.getElementById('status');
const params = new URLSearchParams(window.location.search);
const shot = params.get('shot');
const seed = Number.parseInt(params.get('seed') ?? '1', 10) || 1;

function describe(world) {
  if (world.screen === SCREEN_TITLE) return 'Sizzle and Serve: press Enter to start your shift.';
  if (world.screen === SCREEN_OVER) return `Shift over. Score ${world.score}, ${world.served} dishes served. Press R to cook again.`;
  return `Cooking. Score ${world.score}, ${world.served} dishes served, ${world.hearts} hearts left.`;
}

if (shot) {
  // Screenshot mode: stage the scene, draw one frame, stop. The frame is a
  // real render of the game's own code, stepped forward by its own rules.
  const world = createShotWorld(seed);
  stageShot(shot, world);
  drawWorld(ctx, world);
  statusLine.textContent = describe(world);
} else {
  const world = createWorld(1);
  const input = createInput(canvas);
  let last = performance.now();
  let accumulator = 0;
  let lastScreen = world.screen;

  function frame(now) {
    const elapsed = Math.min(0.1, (now - last) / 1000);
    last = now;
    accumulator += elapsed;
    input.poll();

    if (world.screen === SCREEN_TITLE && (input.startPressed || input.mouse.clicked)) {
      startGame(world);
    } else if (world.screen === SCREEN_OVER && input.restartPressed) {
      startGame(world);
    }

    while (accumulator >= STEP) {
      stepWorld(world, STEP, input);
      accumulator -= STEP;
    }
    input.endFrame();

    if (world.screen !== lastScreen) {
      statusLine.textContent = describe(world);
      lastScreen = world.screen;
    }
    drawWorld(ctx, world);
    requestAnimationFrame(frame);
  }

  statusLine.textContent = describe(world);
  drawWorld(ctx, world);
  requestAnimationFrame(frame);
}
