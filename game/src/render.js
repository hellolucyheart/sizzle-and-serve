// Every pixel of the game: the kitchen, the chef, the stations, the order
// board, the HUD and the title / game-over screens. Pure drawing from the
// world state; no logic lives here.
import {
  CHOP_SECONDS, GRILL_SECONDS, BURN_AFTER, INGREDIENTS, PALETTE, RECIPES,
  ROOM, STATIONS, VIEW, itemLabel,
} from './config.js';
import { SCREEN_OVER, SCREEN_PLAY, SCREEN_TITLE, dishOnCounter, nearestStation } from './world.js';

function roundRect(ctx, x, y, w, h, radius) {
  ctx.beginPath();
  ctx.moveTo(x + radius, y);
  ctx.arcTo(x + w, y, x + w, y + h, radius);
  ctx.arcTo(x + w, y + h, x, y + h, radius);
  ctx.arcTo(x, y + h, x, y, radius);
  ctx.arcTo(x, y, x + w, y, radius);
  ctx.closePath();
}

function text(ctx, value, x, y, size, color, weight = 'bold', align = 'center') {
  ctx.fillStyle = color;
  ctx.font = `${weight} ${size}px system-ui, -apple-system, "Segoe UI", sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = 'middle';
  ctx.fillText(value, x, y);
}

function heart(ctx, x, y, size, filled) {
  ctx.save();
  ctx.translate(x, y);
  ctx.scale(size / 16, size / 16);
  ctx.beginPath();
  ctx.moveTo(0, 5);
  ctx.bezierCurveTo(-8, -3, -4, -9, 0, -4);
  ctx.bezierCurveTo(4, -9, 8, -3, 0, 5);
  ctx.closePath();
  ctx.fillStyle = filled ? '#d94f3d' : '#cbb59a';
  ctx.fill();
  ctx.restore();
}

function coin(ctx, x, y, radius) {
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fillStyle = '#f2c94c';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = '#b98a2e';
  ctx.stroke();
  text(ctx, '$', x, y + 1, radius + 4, '#8a5f16');
}

/** Draw one ingredient / dish icon centred at (x, y) inside a box of `size`. */
export function drawItemIcon(ctx, item, x, y, size) {
  const half = size / 2;
  ctx.save();
  ctx.translate(x, y);
  if (item === 'plate' || item === 'plate-full') {
    ctx.beginPath();
    ctx.ellipse(0, 0, half, half * 0.62, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#fdfdf8';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#b9ac93';
    ctx.stroke();
    ctx.beginPath();
    ctx.ellipse(0, 0, half * 0.55, half * 0.34, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#e9e2cf';
    ctx.fill();
    ctx.restore();
    return;
  }
  const [base, prep] = item.split('-');
  const ingredient = INGREDIENTS[base];
  const color = prep === 'burnt' ? '#2b2018' : ingredient.color;
  if (base === 'tomato') {
    ctx.beginPath();
    ctx.arc(0, 0, half * 0.85, 0, Math.PI * 2);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = '#5da24a';
    ctx.beginPath();
    ctx.moveTo(0, -half * 0.7);
    ctx.lineTo(-half * 0.45, -half * 1.05);
    ctx.lineTo(0, -half * 0.8);
    ctx.lineTo(half * 0.45, -half * 1.05);
    ctx.lineTo(0, -half * 0.7);
    ctx.fill();
  } else if (base === 'lettuce') {
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(0, 0, half, half * 0.62, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.strokeStyle = '#3f7a33';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-half * 0.6, 0);
    ctx.quadraticCurveTo(0, -half * 0.5, half * 0.6, 0);
    ctx.stroke();
  } else if (base === 'bread') {
    roundRect(ctx, -half, -half * 0.6, size, size * 0.62, half * 0.4);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = '#b98a2e';
    ctx.lineWidth = 2;
    ctx.stroke();
  } else if (base === 'cheese') {
    ctx.beginPath();
    ctx.moveTo(-half * 0.85, half * 0.55);
    ctx.lineTo(half * 0.85, half * 0.55);
    ctx.lineTo(half * 0.85, -half * 0.55);
    ctx.closePath();
    ctx.fillStyle = color;
    ctx.fill();
    ctx.fillStyle = '#d9a13b';
    ctx.beginPath();
    ctx.arc(-half * 0.2, half * 0.1, half * 0.12, 0, Math.PI * 2);
    ctx.arc(half * 0.35, -half * 0.2, half * 0.12, 0, Math.PI * 2);
    ctx.fill();
  } else if (base === 'patty') {
    roundRect(ctx, -half, -half * 0.55, size, size * 0.7, half * 0.35);
    ctx.fillStyle = color;
    ctx.fill();
    if (prep === 'grilled') {
      ctx.strokeStyle = '#5a3a22';
      ctx.lineWidth = 3;
      for (const offset of [-0.4, 0, 0.4]) {
        ctx.beginPath();
        ctx.moveTo(offset * size, -half * 0.4);
        ctx.lineTo(offset * size, half * 0.4);
        ctx.stroke();
      }
    }
  }
  if (prep === 'chopped') {
    ctx.strokeStyle = 'rgba(255,255,255,0.85)';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(-half * 0.5, -half * 0.5);
    ctx.lineTo(half * 0.5, half * 0.5);
    ctx.moveTo(half * 0.5, -half * 0.5);
    ctx.lineTo(-half * 0.5, half * 0.5);
    ctx.stroke();
  }
  ctx.restore();
}

function drawFloor(ctx) {
  ctx.fillStyle = PALETTE.floor;
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  ctx.fillStyle = PALETTE.floorTile;
  const tile = 64;
  for (let y = ROOM.y; y < ROOM.y + ROOM.height; y += tile) {
    for (let x = ROOM.x + ((y / tile) % 2) * tile / 2; x < ROOM.x + ROOM.width; x += tile) {
      ctx.fillRect(x, y, tile - 2, tile - 2);
    }
  }
  ctx.fillStyle = PALETTE.wallTop;
  ctx.fillRect(0, 0, VIEW.width, WALL_TOP);
  ctx.fillStyle = PALETTE.wall;
  ctx.fillRect(0, WALL_TOP, VIEW.width, 8);
}

const WALL_TOP = 88;

function drawOrderTicket(ctx, order, x, y, w, h) {
  const recipe = order.recipe;
  const patienceShare = Math.max(0, order.patience / order.maxPatience);
  roundRect(ctx, x, y, w, h, 10);
  ctx.fillStyle = '#fff8e6';
  ctx.fill();
  ctx.lineWidth = 2;
  ctx.strokeStyle = patienceShare < 0.3 ? '#d94f3d' : '#c9a06a';
  ctx.stroke();
  text(ctx, recipe.name, x + w / 2, y + 14, 12, PALETTE.ink);
  let iconX = x + w / 2 - (recipe.needs.length - 1) * 16;
  for (const need of recipe.needs) {
    drawItemIcon(ctx, need, iconX, y + 40, 24);
    iconX += 32;
  }
  roundRect(ctx, x + 10, y + h - 15, w - 52, 8, 4);
  ctx.fillStyle = '#e5d9bd';
  ctx.fill();
  roundRect(ctx, x + 10, y + h - 15, (w - 52) * patienceShare, 8, 4);
  ctx.fillStyle = patienceShare < 0.3 ? '#d94f3d' : '#4d9b4d';
  ctx.fill();
  text(ctx, `$${recipe.price}`, x + w - 8, y + h - 11, 12, '#8a5f16', 'bold', 'right');
}

function drawOrders(ctx, world) {
  text(ctx, 'ORDER BOARD', 355, 108, 13, PALETTE.inkSoft, 'bold', 'center');
  const ticketW = 108;
  const ticketH = 76;
  for (let index = 0; index < 3; index += 1) {
    const x = 176 + index * 118;
    const order = world.orders[index];
    if (order) drawOrderTicket(ctx, order, x, 118, ticketW, ticketH);
    else {
      roundRect(ctx, x, 118, ticketW, ticketH, 10);
      ctx.fillStyle = 'rgba(255,248,230,0.45)';
      ctx.fill();
      ctx.setLineDash([5, 5]);
      ctx.lineWidth = 2;
      ctx.strokeStyle = '#b99f78';
      ctx.stroke();
      ctx.setLineDash([]);
      text(ctx, 'waiting…', x + ticketW / 2, 156, 13, '#a68d68');
    }
  }
}

function drawStation(ctx, world, station, highlight) {
  const rect = station.rect;
  roundRect(ctx, rect.x, rect.y, rect.w, rect.h, 12);
  ctx.fillStyle = PALETTE.counterTop;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = highlight ? '#ffd94d' : PALETTE.counterEdge;
  ctx.stroke();
  ctx.fillStyle = PALETTE.counter;
  ctx.fillRect(rect.x + 4, rect.y + rect.h - 12, rect.w - 8, 8);

  const centreX = rect.x + rect.w / 2;
  const centreY = rect.y + rect.h / 2;
  if (station.kind === 'bin') {
    drawItemIcon(ctx, station.item, centreX, centreY - 8, 34);
  } else if (station.kind === 'board') {
    roundRect(ctx, rect.x + 18, rect.y + 12, rect.w - 36, rect.h - 30, 8);
    ctx.fillStyle = PALETTE.board;
    ctx.fill();
    if (world.board.item) {
      drawItemIcon(ctx, world.board.item, centreX, centreY - 2, 36);
      if (world.board.progress > 0) {
        const share = world.board.progress / CHOP_SECONDS;
        ctx.fillStyle = 'rgba(43,29,18,0.75)';
        ctx.fillRect(rect.x + 18, rect.y + rect.h - 18, (rect.w - 36) * share, 6);
      }
    } else {
      // A small drawn knife (no emoji: headless fonts may lack it).
      ctx.save();
      ctx.translate(centreX, centreY - 2);
      ctx.rotate(-0.6);
      ctx.fillStyle = '#8a94a6';
      roundRect(ctx, -4, -22, 8, 26, 3);
      ctx.fill();
      ctx.fillStyle = '#5c4632';
      roundRect(ctx, -5, 4, 10, 14, 3);
      ctx.fill();
      ctx.restore();
    }
  } else if (station.kind === 'grill') {
    ctx.fillStyle = '#3a3a3a';
    roundRect(ctx, rect.x + 14, rect.y + 10, rect.w - 28, rect.h - 28, 8);
    ctx.fill();
    ctx.strokeStyle = '#777';
    ctx.lineWidth = 2;
    for (let index = 1; index < 4; index += 1) {
      ctx.beginPath();
      ctx.moveTo(rect.x + 14 + index * ((rect.w - 28) / 4), rect.y + 12);
      ctx.lineTo(rect.x + 14 + index * ((rect.w - 28) / 4), rect.y + rect.h - 18);
      ctx.stroke();
    }
    if (world.grill.item) {
      drawItemIcon(ctx, world.grill.state === 'done' ? 'patty-grilled' : world.grill.state === 'burnt' ? 'patty-burnt' : 'patty', centreX, centreY - 2, 36);
      const total = world.grill.state === 'done' ? GRILL_SECONDS : GRILL_SECONDS + BURN_AFTER;
      const share = Math.min(1, world.grill.progress / total);
      ctx.fillStyle = world.grill.state === 'burnt' ? '#d94f3d' : world.grill.state === 'done' ? '#4d9b4d' : '#e9a13b';
      ctx.fillRect(rect.x + 18, rect.y + rect.h - 18, (rect.w - 36) * share, 6);
    }
  } else if (station.kind === 'plates') {
    for (let index = 0; index < 3; index += 1) {
      ctx.beginPath();
      ctx.ellipse(centreX, centreY - 10 + index * 7, 26, 9, 0, 0, Math.PI * 2);
      ctx.fillStyle = '#fdfdf8';
      ctx.fill();
      ctx.strokeStyle = '#b9ac93';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    }
  } else if (station.kind === 'plating') {
    roundRect(ctx, rect.x + 14, rect.y + 10, rect.w - 28, rect.h - 28, 8);
    ctx.fillStyle = PALETTE.board;
    ctx.fill();
    if (world.counterPlate) {
      drawItemIcon(ctx, 'plate', centreX, centreY, 52);
      let iconX = centreX - (world.counterPlate.items.length - 1) * 16;
      for (const item of world.counterPlate.items) {
        drawItemIcon(ctx, item, iconX, centreY - 4, 24);
        iconX += 32;
      }
      const dish = dishOnCounter(world);
      if (dish) text(ctx, dish.name, centreX, rect.y + rect.h - 8, 13, '#4d7a35');
    } else {
      text(ctx, 'plate here', centreX, centreY, 14, '#a68d68');
    }
  } else if (station.kind === 'trash') {
    roundRect(ctx, centreX - 20, centreY - 18, 40, 36, 6);
    ctx.fillStyle = '#5c6b73';
    ctx.fill();
    text(ctx, '×', centreX, centreY + 1, 26, '#e8e2d2');
  } else if (station.kind === 'window') {
    roundRect(ctx, rect.x + 10, rect.y + 10, rect.w - 20, rect.h - 20, 8);
    ctx.fillStyle = '#7fb069';
    ctx.fill();
    text(ctx, 'SERVE', centreX, centreY, 16, '#ffffff');
  }
  text(ctx, station.label, centreX, rect.y + rect.h + 14, 12, PALETTE.inkSoft);
}

function drawChef(ctx, world) {
  const chef = world.chef;
  ctx.save();
  ctx.translate(chef.x, chef.y);
  ctx.beginPath();
  ctx.arc(0, 0, 20, 0, Math.PI * 2);
  ctx.fillStyle = '#fdfdf8';
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#d8cdb2';
  ctx.stroke();
  // Toque (chef hat).
  ctx.beginPath();
  ctx.arc(-8, -16, 8, 0, Math.PI * 2);
  ctx.arc(0, -20, 9, 0, Math.PI * 2);
  ctx.arc(8, -16, 8, 0, Math.PI * 2);
  ctx.fillStyle = '#ffffff';
  ctx.fill();
  ctx.fillRect(-14, -18, 28, 8);
  // Face.
  ctx.fillStyle = '#2b1d12';
  ctx.beginPath();
  ctx.arc(-6 * chef.face, -2, 2.4, 0, Math.PI * 2);
  ctx.arc(6 * chef.face, -2, 2.4, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(2 * chef.face, 5, 5, 0.15 * Math.PI, 0.85 * Math.PI);
  ctx.strokeStyle = '#2b1d12';
  ctx.lineWidth = 2;
  ctx.stroke();
  ctx.restore();

  if (chef.carrying) {
    const bob = Math.sin(world.time * 6) * 2;
    if (chef.carrying === 'plate') {
      drawItemIcon(ctx, 'plate', chef.x, chef.y - 40 + bob, 44);
      let iconX = chef.x - (chef.plateItems.length - 1) * 13;
      for (const item of chef.plateItems) {
        drawItemIcon(ctx, item, iconX, chef.y - 44 + bob, 20);
        iconX += 26;
      }
    } else {
      drawItemIcon(ctx, chef.carrying, chef.x, chef.y - 38 + bob, 34);
    }
  }
}

function drawHud(ctx, world) {
  ctx.fillStyle = PALETTE.wallTop;
  ctx.fillRect(0, 0, VIEW.width, WALL_TOP);
  text(ctx, 'SIZZLE & SERVE', 130, 30, 26, '#fff6e3', 'bold', 'left');
  text(ctx, 'tiny kitchen rush', 130, 56, 13, '#f0d9a8', 'normal', 'left');

  const timeShare = Math.max(0, world.timeLeft / 150);
  const minutes = Math.floor(world.timeLeft / 60);
  const seconds = Math.floor(world.timeLeft % 60).toString().padStart(2, '0');
  text(ctx, `⏱ ${minutes}:${seconds}`, 640, 26, 26, timeShare < 0.2 ? '#ff8a7a' : '#fff6e3');
  roundRect(ctx, 520, 48, 240, 10, 5);
  ctx.fillStyle = 'rgba(0,0,0,0.3)';
  ctx.fill();
  roundRect(ctx, 520, 48, 240 * timeShare, 10, 5);
  ctx.fillStyle = timeShare < 0.2 ? '#d94f3d' : '#4d9b4d';
  ctx.fill();

  coin(ctx, 1060, 30, 13);
  text(ctx, `${world.coins}`, 1080, 30, 22, '#fff6e3', 'bold', 'left');
  text(ctx, `SCORE ${world.score}`, 1060, 62, 16, '#fff6e3', 'bold', 'left');
  for (let index = 0; index < 3; index += 1) {
    heart(ctx, 900 + index * 30, 30, 22, index < world.hearts);
  }
  text(ctx, `served ${world.served}`, 915, 62, 14, '#f0d9a8', 'normal', 'left');
}

function drawHint(ctx, world) {
  const station = nearestStation(world);
  let hint = 'WASD / arrows to move · E to use a station';
  if (station) {
    const carrying = world.chef.carrying;
    if (station.kind === 'bin') hint = carrying ? 'Hands full' : `E — take ${station.label.toLowerCase()}`;
    else if (station.kind === 'board') hint = world.board.item ? 'Hold E — chop!' : 'E — put a tomato or lettuce here';
    else if (station.kind === 'grill') hint = world.grill.state === 'done' ? 'E — take the grilled patty' : world.grill.state === 'burnt' ? 'E — take the burnt patty' : 'E — grill a raw patty';
    else if (station.kind === 'plates') hint = 'E — take a plate';
    else if (station.kind === 'plating') hint = 'E — build your dish on the plate';
    else if (station.kind === 'window') hint = 'E — serve the dish';
    else if (station.kind === 'trash') hint = 'E — throw it away';
  }
  if (world.chef.carrying) hint += `  ·  carrying: ${itemLabel(world.chef.carrying)}`;
  text(ctx, hint, VIEW.width / 2, VIEW.height - 18, 15, PALETTE.cream);
  if (world.message) {
    text(ctx, world.message, VIEW.width / 2, VIEW.height - 46, 17, '#ffd94d');
  }
}

function drawTitle(ctx, world) {
  ctx.fillStyle = 'rgba(36,24,18,0.72)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, '🍳 SIZZLE & SERVE', VIEW.width / 2, 190, 56, '#fff6e3');
  text(ctx, 'tiny kitchen rush', VIEW.width / 2, 240, 24, '#f0d9a8');
  text(ctx, 'Orders fly in. Chop, grill, plate and serve before patience runs out!', VIEW.width / 2, 300, 19, '#fff6e3');
  let y = 350;
  for (const recipe of RECIPES) {
    text(ctx, `${recipe.name} — ${recipe.needs.map(itemLabel).join(' + ')}  ·  $${recipe.price}`, VIEW.width / 2, y, 18, '#ffe9b8');
    y += 30;
  }
  text(ctx, 'Move: WASD / arrows      Use station: E (hold E to chop)      Serve at the window', VIEW.width / 2, 470, 17, '#fff6e3');
  text(ctx, '3 hearts — an order that waits too long walks out. 150 seconds a shift.', VIEW.width / 2, 500, 17, '#fff6e3');
  const pulse = 0.65 + 0.35 * Math.sin(world.time * 4);
  ctx.globalAlpha = pulse;
  text(ctx, 'Press ENTER or click to start', VIEW.width / 2, 570, 24, '#ffd94d');
  ctx.globalAlpha = 1;
}

function drawOver(ctx, world) {
  ctx.fillStyle = 'rgba(36,24,18,0.78)';
  ctx.fillRect(0, 0, VIEW.width, VIEW.height);
  text(ctx, 'SHIFT OVER!', VIEW.width / 2, 200, 52, '#fff6e3');
  text(ctx, `Dishes served: ${world.served}      Orders lost: ${world.failed}`, VIEW.width / 2, 280, 22, '#fff6e3');
  text(ctx, `Coins earned: $${world.coins}`, VIEW.width / 2, 325, 22, '#ffe9b8');
  text(ctx, `SCORE  ${world.score}`, VIEW.width / 2, 390, 40, '#ffd94d');
  text(ctx, `Best this session: ${world.best}`, VIEW.width / 2, 440, 18, '#f0d9a8');
  const pulse = 0.65 + 0.35 * Math.sin(world.time * 4);
  ctx.globalAlpha = pulse;
  text(ctx, 'Press R to cook again', VIEW.width / 2, 510, 24, '#ffd94d');
  ctx.globalAlpha = 1;
}

export function drawWorld(ctx, world) {
  drawFloor(ctx);
  drawOrders(ctx, world);
  const near = nearestStation(world);
  for (const station of STATIONS) drawStation(ctx, world, station, near === station);
  drawChef(ctx, world);
  drawHud(ctx, world);
  if (world.screen === SCREEN_PLAY) drawHint(ctx, world);
  if (world.screen === SCREEN_TITLE) drawTitle(ctx, world);
  if (world.screen === SCREEN_OVER) drawOver(ctx, world);
}
