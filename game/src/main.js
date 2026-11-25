// main.js — boots Tiny Kitchen Rush: builds the world, wires the
// input, and runs the fixed-step loop that updates and renders it.
// A ?shot=1|2|3 query freezes a staged scene instead (used to take the
// screenshots in screenshots/; harmless in normal play).

import { HEIGHT, WIDTH } from "./config.js";
import { attachInput } from "./input.js";
import { render } from "./render.js";
import { createWorld, demoWorld, update } from "./world.js";

const canvas = document.getElementById("game");
const ctx = canvas.getContext("2d");
canvas.width = WIDTH;
canvas.height = HEIGHT;

const shot = new URLSearchParams(window.location.search).get("shot");
const world = shot ? demoWorld(Number(shot)) : createWorld();
attachInput(canvas, world);

let last = performance.now();
function frame(now) {
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  if (!shot) update(world, dt);
  render(ctx, world);
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
