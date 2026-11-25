// Keyboard and mouse input, read once per frame into a plain object the world
// steps with. Keys: WASD or arrows to move, E or Space to use a station,
// R to restart on the end screen, Enter to start.
export function createInput(canvas) {
  const keys = new Set();
  const input = {
    moveX: 0,
    moveY: 0,
    use: false,
    usePressed: false,
    restartPressed: false,
    startPressed: false,
    mouse: { x: 0, y: 0, clicked: false },
  };

  function keyName(event) {
    return event.key.length === 1 ? event.key.toLowerCase() : event.key;
  }

  window.addEventListener('keydown', (event) => {
    const key = keyName(event);
    if ([' ', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(key)) event.preventDefault();
    if (!keys.has(key)) {
      if (key === 'e' || key === ' ') input.usePressed = true;
      if (key === 'r') input.restartPressed = true;
      if (key === 'enter') input.startPressed = true;
    }
    keys.add(key);
  });
  window.addEventListener('keyup', (event) => keys.delete(keyName(event)));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('pointermove', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    input.mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
  });
  canvas.addEventListener('pointerdown', (event) => {
    const rect = canvas.getBoundingClientRect();
    input.mouse.x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    input.mouse.y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    input.mouse.clicked = true;
    input.usePressed = true;
  });

  input.poll = () => {
    const left = keys.has('a') || keys.has('arrowleft');
    const right = keys.has('d') || keys.has('arrowright');
    const up = keys.has('w') || keys.has('arrowup');
    const down = keys.has('s') || keys.has('arrowdown');
    input.moveX = (right ? 1 : 0) - (left ? 1 : 0);
    input.moveY = (down ? 1 : 0) - (up ? 1 : 0);
    if (input.moveX !== 0 && input.moveY !== 0) {
      const length = Math.hypot(input.moveX, input.moveY);
      input.moveX /= length;
      input.moveY /= length;
    }
    input.use = keys.has('e') || keys.has(' ');
  };

  input.endFrame = () => {
    input.usePressed = false;
    input.restartPressed = false;
    input.startPressed = false;
    input.mouse.clicked = false;
  };

  return input;
}
