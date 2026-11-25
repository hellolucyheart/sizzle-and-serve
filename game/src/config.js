// Sizzle & Serve — configuration: canvas, palette, kitchen layout, recipes, timings.
// One file, one job: every tunable number of the game lives here.
export const VIEW = { width: 1280, height: 720 };

export const STEP = 1 / 60;
export const SHIFT_SECONDS = 150;
export const MAX_HEARTS = 3;
export const MAX_ORDERS = 3;
export const ORDER_PATIENCE = 48;
export const ORDER_SPAWN_EVERY = 11;

export const CHEF = { radius: 20, speed: 250, accel: 2200 };
export const INTERACT_RANGE = 78;
export const CHOP_SECONDS = 1.4;
export const GRILL_SECONDS = 4.5;
export const BURN_AFTER = 6.5;

// The kitchen is a top-down room. Walls are the outer frame; counters are
// solid rectangles the chef walks around. Stations sit on the counters.
export const WALL = 24;
export const ROOM = { x: WALL, y: 96, width: VIEW.width - WALL * 2, height: 560 };

export const PALETTE = {
  floor: '#e8c99a',
  floorTile: '#dfc08a',
  wall: '#7a4a2b',
  wallTop: '#93582f',
  counter: '#b98a5a',
  counterTop: '#d9ab72',
  counterEdge: '#8a5f36',
  board: '#f4ead2',
  ink: '#2b1d12',
  inkSoft: '#5c4632',
  cream: '#fff6e3',
  red: '#d94f3d',
  green: '#4d9b4d',
  gold: '#e9a13b',
  blue: '#4a7fb5',
  pink: '#e58aa5',
  dark: '#241812',
};

export const INGREDIENTS = {
  tomato: { name: 'Tomato', color: '#d94f3d', chop: true, grill: false },
  lettuce: { name: 'Lettuce', color: '#5da24a', chop: true, grill: false },
  bread: { name: 'Bread', color: '#e0a458', chop: false, grill: false },
  cheese: { name: 'Cheese', color: '#f2c94c', chop: false, grill: false },
  patty: { name: 'Patty', color: '#8a5a3b', chop: false, grill: true },
};

export const RECIPES = [
  {
    id: 'salad',
    name: 'Garden Salad',
    needs: ['tomato-chopped', 'lettuce-chopped'],
    price: 22,
  },
  {
    id: 'burger',
    name: 'Sunny Burger',
    needs: ['bread', 'patty-grilled', 'lettuce-chopped'],
    price: 34,
  },
  {
    id: 'melt',
    name: 'Cheesy Melt',
    needs: ['bread', 'patty-grilled', 'cheese'],
    price: 30,
  },
];

// Stations. `at` is the point the chef stands next to; `rect` is the solid body.
export const STATIONS = [
  { id: 'bin-tomato', kind: 'bin', item: 'tomato', label: 'Tomato', rect: { x: 48, y: 120, w: 110, h: 64 }, at: { x: 184, y: 152 } },
  { id: 'bin-lettuce', kind: 'bin', item: 'lettuce', label: 'Lettuce', rect: { x: 48, y: 204, w: 110, h: 64 }, at: { x: 184, y: 236 } },
  { id: 'bin-bread', kind: 'bin', item: 'bread', label: 'Bread', rect: { x: 48, y: 288, w: 110, h: 64 }, at: { x: 184, y: 320 } },
  { id: 'bin-cheese', kind: 'bin', item: 'cheese', label: 'Cheese', rect: { x: 48, y: 372, w: 110, h: 64 }, at: { x: 184, y: 404 } },
  { id: 'bin-patty', kind: 'bin', item: 'patty', label: 'Patty', rect: { x: 48, y: 456, w: 110, h: 64 }, at: { x: 184, y: 488 } },
  { id: 'board', kind: 'board', label: 'Chop', rect: { x: 560, y: 120, w: 160, h: 64 }, at: { x: 640, y: 208 } },
  { id: 'grill', kind: 'grill', label: 'Grill', rect: { x: 760, y: 120, w: 160, h: 64 }, at: { x: 840, y: 208 } },
  { id: 'plates', kind: 'plates', label: 'Plates', rect: { x: 960, y: 120, w: 120, h: 64 }, at: { x: 1020, y: 208 } },
  { id: 'plating', kind: 'plating', label: 'Plate up', rect: { x: 560, y: 592, w: 200, h: 64 }, at: { x: 660, y: 568 } },
  { id: 'trash', kind: 'trash', label: 'Trash', rect: { x: 1120, y: 592, w: 112, h: 64 }, at: { x: 1176, y: 568 } },
  { id: 'window', kind: 'window', label: 'Serve', rect: { x: 1120, y: 120, w: 112, h: 64 }, at: { x: 1176, y: 208 } },
];

export function stationById(id) {
  return STATIONS.find((station) => station.id === id);
}

/** Human label for a carried item id such as `tomato-chopped` or `plate`. */
export function itemLabel(item) {
  if (item === 'plate') return 'Plate';
  if (item === 'plate-full') return 'Plated dish';
  const [base, prep] = item.split('-');
  const ingredient = INGREDIENTS[base];
  if (!ingredient) return item;
  if (prep === 'chopped') return `Chopped ${ingredient.name}`;
  if (prep === 'grilled') return `Grilled ${ingredient.name}`;
  if (prep === 'burnt') return 'Burnt patty';
  return ingredient.name;
}
