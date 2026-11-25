// The kitchen simulation: one state object, one fixed step. The chef walks the
// room, picks ingredients from bins, chops them on the board, grills patties on
// the stove, plates dishes on the counter and serves them at the window before
// the order's patience runs out. Nothing here touches the DOM or the clock:
// every step takes an explicit dt and an input object.
import {
  CHOP_SECONDS, GRILL_SECONDS, BURN_AFTER, CHEF, INGREDIENTS, INTERACT_RANGE,
  MAX_HEARTS, MAX_ORDERS, ORDER_PATIENCE, ORDER_SPAWN_EVERY, RECIPES, ROOM,
  SHIFT_SECONDS, STATIONS, itemLabel,
} from './config.js';
import { mulberry32, pick } from './random.js';
import { playSound } from './audio.js';

export const SCREEN_TITLE = 'title';
export const SCREEN_PLAY = 'play';
export const SCREEN_OVER = 'over';

export const EVENT_OVER = 1;
export const EVENT_SERVED = 2;

function freshChef() {
  return { x: 640, y: 430, vx: 0, vy: 0, face: 1, carrying: null, plateItems: [] };
}

export function createWorld(seed = 1) {
  return {
    seed,
    random: mulberry32(seed),
    time: 0,
    timeLeft: SHIFT_SECONDS,
    screen: SCREEN_TITLE,
    chef: freshChef(),
    orders: [],
    nextOrderId: 1,
    spawnTimer: 2,
    grill: { item: null, progress: 0, state: 'empty' },
    board: { item: null, progress: 0 },
    counterPlate: null,
    score: 0,
    coins: 0,
    served: 0,
    failed: 0,
    hearts: MAX_HEARTS,
    message: null,
    messageUntil: 0,
    best: 0,
  };
}

export function resetWorld(world) {
  const seed = world.seed;
  const best = world.best;
  Object.assign(world, createWorld(seed));
  world.best = best;
}

function say(world, text) {
  world.message = text;
  world.messageUntil = world.time + 2.2;
}

function spawnOrder(world) {
  const recipe = pick(world.random, RECIPES);
  world.orders.push({
    id: world.nextOrderId,
    recipe,
    patience: ORDER_PATIENCE,
    maxPatience: ORDER_PATIENCE,
  });
  world.nextOrderId += 1;
  playSound('spawn');
}

function setsMatch(a, b) {
  if (a.length !== b.length) return false;
  const sortedA = [...a].sort();
  const sortedB = [...b].sort();
  return sortedA.every((value, index) => value === sortedB[index]);
}

function recipeFor(world, items) {
  return RECIPES.find((recipe) => setsMatch(recipe.needs, items)) ?? null;
}

export function nearestStation(world) {
  const chef = world.chef;
  let nearest = null;
  let nearestDistance = Infinity;
  for (const station of STATIONS) {
    const distance = Math.hypot(station.at.x - chef.x, station.at.y - chef.y);
    if (distance < nearestDistance) {
      nearestDistance = distance;
      nearest = station;
    }
  }
  return nearestDistance <= INTERACT_RANGE ? nearest : null;
}

function circleHitsRect(x, y, radius, rect) {
  const closestX = Math.max(rect.x, Math.min(x, rect.x + rect.w));
  const closestY = Math.max(rect.y, Math.min(y, rect.y + rect.h));
  return Math.hypot(x - closestX, y - closestY) < radius;
}

function resolveCollisions(world) {
  const chef = world.chef;
  const radius = CHEF.radius;
  chef.x = Math.max(ROOM.x + radius, Math.min(ROOM.x + ROOM.width - radius, chef.x));
  chef.y = Math.max(ROOM.y + radius, Math.min(ROOM.y + ROOM.height - radius, chef.y));
  for (const station of STATIONS) {
    const rect = station.rect;
    if (!circleHitsRect(chef.x, chef.y, radius, rect)) continue;
    const left = chef.x - (rect.x - radius);
    const right = rect.x + rect.w + radius - chef.x;
    const top = chef.y - (rect.y - radius);
    const bottom = rect.y + rect.h + radius - chef.y;
    const push = Math.min(left, right, top, bottom);
    if (push === left) chef.x = rect.x - radius;
    else if (push === right) chef.x = rect.x + rect.w + radius;
    else if (push === top) chef.y = rect.y - radius;
    else chef.y = rect.y + rect.h + radius;
  }
}

function useStation(world) {
  const chef = world.chef;
  const station = nearestStation(world);
  if (!station) return;
  const carrying = chef.carrying;

  if (station.kind === 'bin') {
    if (carrying) { say(world, 'Hands full — serve or trash it first'); return; }
    chef.carrying = station.item;
    playSound('pickup');
    return;
  }

  if (station.kind === 'board') {
    if (world.board.item && !carrying) {
      chef.carrying = world.board.item;
      world.board.item = null;
      world.board.progress = 0;
      playSound('pickup');
      return;
    }
    if (!world.board.item && carrying && INGREDIENTS[carrying]?.chop) {
      world.board.item = carrying;
      world.board.progress = 0;
      chef.carrying = null;
      playSound('place');
      return;
    }
    if (world.board.item && carrying) say(world, 'The board is busy');
    else if (carrying) say(world, `${itemLabel(carrying)} needs no chopping`);
    return;
  }

  if (station.kind === 'grill') {
    if (world.grill.state === 'empty' && carrying === 'patty') {
      world.grill.item = 'patty';
      world.grill.progress = 0;
      world.grill.state = 'cooking';
      chef.carrying = null;
      playSound('place');
      return;
    }
    if ((world.grill.state === 'done' || world.grill.state === 'burnt') && !carrying) {
      chef.carrying = world.grill.state === 'done' ? 'patty-grilled' : 'patty-burnt';
      world.grill.item = null;
      world.grill.progress = 0;
      world.grill.state = 'empty';
      playSound('pickup');
      return;
    }
    if (world.grill.state === 'cooking') say(world, 'Still on the grill…');
    else if (carrying) say(world, 'Only a raw patty goes on the grill');
    return;
  }

  if (station.kind === 'plates') {
    if (carrying) { say(world, 'Hands full'); return; }
    chef.carrying = 'plate';
    chef.plateItems = [];
    playSound('pickup');
    return;
  }

  if (station.kind === 'plating') {
    if (carrying === 'plate' && !world.counterPlate) {
      world.counterPlate = { items: [...chef.plateItems] };
      chef.carrying = null;
      chef.plateItems = [];
      playSound('place');
      return;
    }
    if (!carrying && world.counterPlate) {
      chef.carrying = 'plate';
      chef.plateItems = [...world.counterPlate.items];
      world.counterPlate = null;
      playSound('pickup');
      return;
    }
    if (carrying && carrying !== 'plate' && world.counterPlate) {
      if (world.counterPlate.items.includes(carrying)) { say(world, 'Already on the plate'); return; }
      if (world.counterPlate.items.length >= 3) { say(world, 'The plate is full'); return; }
      world.counterPlate.items.push(carrying);
      chef.carrying = null;
      playSound('place');
      return;
    }
    if (carrying === 'plate' && world.counterPlate) say(world, 'A plate is already here');
    else say(world, 'Bring a plate here to build a dish');
    return;
  }

  if (station.kind === 'window') {
    if (carrying !== 'plate') { say(world, 'Bring a plated dish to serve'); return; }
    const match = world.orders.find((order) => setsMatch(order.recipe.needs, chef.plateItems));
    if (!match) {
      playSound('fail');
      say(world, 'No order wants this dish!');
      return;
    }
    const bonus = Math.round(match.patience);
    world.orders = world.orders.filter((order) => order.id !== match.id);
    world.coins += match.recipe.price;
    world.score += match.recipe.price * 10 + bonus;
    world.served += 1;
    chef.carrying = null;
    chef.plateItems = [];
    playSound('serve');
    say(world, `Served ${match.recipe.name}! +${match.recipe.price} coins`);
    return;
  }

  if (station.kind === 'trash') {
    if (!carrying) { say(world, 'Nothing to throw away'); return; }
    chef.carrying = null;
    chef.plateItems = [];
    playSound('place');
    say(world, 'Tossed it');
  }
}

function stepGrill(world, dt) {
  const grill = world.grill;
  if (grill.state === 'empty') return;
  grill.progress += dt;
  if (grill.state === 'cooking' && grill.progress >= GRILL_SECONDS) {
    grill.state = 'done';
    playSound('ding');
  } else if (grill.state === 'done' && grill.progress >= GRILL_SECONDS + BURN_AFTER) {
    grill.state = 'burnt';
    say(world, 'The patty burnt!');
  }
}

function stepBoard(world, dt, input) {
  const board = world.board;
  if (!board.item || !INGREDIENTS[board.item]?.chop) return;
  if (!input.use) return;
  const station = nearestStation(world);
  if (!station || station.kind !== 'board') return;
  board.progress += dt;
  if (board.progress >= CHOP_SECONDS) {
    board.item = `${board.item}-chopped`;
    board.progress = 0;
    playSound('ding');
  }
}

function stepOrders(world, dt) {
  world.spawnTimer -= dt;
  if (world.spawnTimer <= 0 && world.orders.length < MAX_ORDERS) {
    spawnOrder(world);
    world.spawnTimer = ORDER_SPAWN_EVERY;
  }
  for (const order of world.orders) order.patience -= dt;
  const expired = world.orders.filter((order) => order.patience <= 0);
  if (expired.length > 0) {
    world.orders = world.orders.filter((order) => order.patience > 0);
    world.failed += expired.length;
    world.hearts -= expired.length;
    playSound('fail');
    say(world, expired.length === 1 ? 'An order walked out!' : `${expired.length} orders walked out!`);
  }
}

/** Advance the world one fixed step. Returns a bitmask of events. */
export function stepWorld(world, dt, input) {
  let events = 0;
  world.time += dt;
  if (world.screen !== SCREEN_PLAY) return events;

  const chef = world.chef;
  chef.vx += input.moveX * CHEF.accel * dt;
  chef.vy += input.moveY * CHEF.accel * dt;
  const friction = Math.exp(-8 * dt);
  chef.vx *= friction;
  chef.vy *= friction;
  const speed = Math.hypot(chef.vx, chef.vy);
  if (speed > CHEF.speed) {
    chef.vx = (chef.vx / speed) * CHEF.speed;
    chef.vy = (chef.vy / speed) * CHEF.speed;
  }
  chef.x += chef.vx * dt;
  chef.y += chef.vy * dt;
  if (Math.abs(chef.vx) > 20) chef.face = chef.vx > 0 ? 1 : -1;
  resolveCollisions(world);

  if (input.usePressed) useStation(world);
  stepBoard(world, dt, input);
  stepGrill(world, dt);
  stepOrders(world, dt);

  world.timeLeft -= dt;
  if (world.message && world.time > world.messageUntil) world.message = null;
  if (world.hearts <= 0 || world.timeLeft <= 0) {
    world.timeLeft = Math.max(0, world.timeLeft);
    world.hearts = Math.max(0, world.hearts);
    world.screen = SCREEN_OVER;
    world.best = Math.max(world.best, world.score);
    events |= EVENT_OVER;
  }
  return events;
}

export function dishOnCounter(world) {
  if (!world.counterPlate) return null;
  return recipeFor(world, world.counterPlate.items);
}

export function startGame(world) {
  resetWorld(world);
  world.screen = SCREEN_PLAY;
  spawnOrder(world);
  world.spawnTimer = ORDER_SPAWN_EVERY;
}
