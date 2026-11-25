// render.js — draws the whole kitchen on the canvas: the order board,
// the grill, the assembly plate, the ingredient counter and the HUD.
// It also owns the layout boxes the input handler hit-tests against.

import { HEIGHT, INGREDIENTS, INGREDIENT_BY_ID, PATIENCE_SECONDS, WIDTH } from "./config.js";
import { matchingOrderIndex } from "./world.js";

export const BIN_BOXES = INGREDIENTS.map((ing, i) => ({
  id: ing.id,
  x: 16 + i * 208,
  y: 616,
  w: 196,
  h: 120,
}));

export const GRILL_BOXES = [
  { x: 896, y: 130, w: 160, h: 110 },
  { x: 1072, y: 130, w: 160, h: 110 },
];

export const SERVE_BOX = { x: 896, y: 300, w: 160, h: 64 };
export const CLEAR_BOX = { x: 1072, y: 300, w: 160, h: 64 };

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.roundRect(x, y, w, h, r);
}

function text(ctx, str, x, y, { size = 20, color = "#2b2118", bold = false, align = "left" } = {}) {
  ctx.fillStyle = color;
  ctx.font = `${bold ? "700 " : ""}${size}px Verdana, Geneva, sans-serif`;
  ctx.textAlign = align;
  ctx.textBaseline = "middle";
  ctx.fillText(str, x, y);
}

function drawBackground(ctx) {
  ctx.fillStyle = "#f3e2c7";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#e8d3ae";
  for (let x = 0; x < WIDTH; x += 64) ctx.fillRect(x, 0, 2, 596);
  for (let y = 0; y < 596; y += 64) ctx.fillRect(0, y, WIDTH, 2);
  ctx.fillStyle = "#b08954";
  ctx.fillRect(0, 596, WIDTH, HEIGHT - 596);
  ctx.fillStyle = "#966f3e";
  ctx.fillRect(0, 596, WIDTH, 6);
}

function drawHud(ctx, world) {
  ctx.fillStyle = "#43302a";
  ctx.fillRect(0, 0, WIDTH, 60);
  text(ctx, "TINY KITCHEN RUSH", 20, 30, { size: 24, bold: true, color: "#ffd98a" });
  text(ctx, `Score ${world.score}`, 700, 30, { size: 22, bold: true, color: "#ffffff" });
  text(ctx, `Served ${world.served}`, 880, 30, { size: 20, color: "#ffffff" });
  text(ctx, `Walked out ${world.lost}`, 1030, 30, { size: 20, color: "#ffb3ab" });
  // shift timer
  const frac = Math.max(0, world.timeLeft / 90);
  ctx.fillStyle = "#6b5348";
  roundRect(ctx, 420, 20, 240, 20, 10);
  ctx.fill();
  ctx.fillStyle = frac > 0.25 ? "#7ac74f" : "#e5484d";
  roundRect(ctx, 420, 20, 240 * frac, 20, 10);
  ctx.fill();
  text(ctx, `${Math.ceil(world.timeLeft)}s`, 452, 31, { size: 14, bold: true, color: "#ffffff" });
}

function drawOrderBoard(ctx, world) {
  ctx.fillStyle = "#fffaf0";
  roundRect(ctx, 16, 76, 314, 500, 12);
  ctx.fill();
  ctx.strokeStyle = "#8a6d3b";
  ctx.lineWidth = 3;
  ctx.stroke();
  text(ctx, "ORDER BOARD", 173, 102, { size: 22, bold: true, align: "center" });
  if (world.orders.length === 0) {
    text(ctx, "Waiting for tickets…", 173, 200, { size: 17, align: "center", color: "#8a7a63" });
  }
  world.orders.forEach((order, i) => {
    const y = 128 + i * 148;
    ctx.fillStyle = "#fdf1d7";
    roundRect(ctx, 30, y, 286, 136, 10);
    ctx.fill();
    const isMatch = matchingOrderIndex(world) === i;
    ctx.strokeStyle = isMatch ? "#e8a100" : "#d9c08a";
    ctx.lineWidth = isMatch ? 4 : 1.5;
    ctx.stroke();
    text(ctx, order.recipe.name, 44, y + 24, { size: 19, bold: true });
    text(ctx, `$${order.recipe.price}`, 302, y + 24, { size: 17, bold: true, align: "right", color: "#7a5b12" });
    order.recipe.items.forEach((id, j) => {
      const ing = INGREDIENT_BY_ID[id];
      const cy = y + 52 + j * 20;
      ctx.fillStyle = ing.color;
      ctx.beginPath();
      ctx.arc(56, cy, 7, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = "#8a6d3b";
      ctx.lineWidth = 1;
      ctx.stroke();
      text(ctx, ing.cook ? `${ing.name} (grilled)` : ing.name, 72, cy, { size: 15 });
    });
    const frac = Math.max(0, order.patienceLeft / PATIENCE_SECONDS);
    ctx.fillStyle = "#e3d5b8";
    roundRect(ctx, 44, y + 122, 258, 8, 4);
    ctx.fill();
    ctx.fillStyle = frac > 0.35 ? "#7ac74f" : "#e5484d";
    roundRect(ctx, 44, y + 122, 258 * frac, 8, 4);
    ctx.fill();
  });
}

function drawPlate(ctx, world) {
  text(ctx, "ASSEMBLY COUNTER", 605, 92, { size: 18, bold: true, align: "center", color: "#6b4f2a" });
  const shake = world.shakeT > 0 ? Math.sin(world.shakeT * 60) * 6 : 0;
  const cx = 605 + shake;
  const cy = 430;
  ctx.fillStyle = "#d9c8a9";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 66, 190, 34, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffffff";
  ctx.beginPath();
  ctx.ellipse(cx, cy + 58, 180, 30, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#c9b48c";
  ctx.lineWidth = 2;
  ctx.stroke();
  if (world.plate.length === 0) {
    text(ctx, "empty plate", cx, cy + 20, { size: 16, align: "center", color: "#a08b6d" });
  }
  world.plate.forEach((id, i) => {
    const ing = INGREDIENT_BY_ID[id];
    const w = id === "bun" ? 250 : id === "patty" ? 235 : id === "cheese" ? 215 : 225;
    const y = cy + 44 - i * 24;
    ctx.fillStyle = ing.color;
    roundRect(ctx, cx - w / 2, y - 13, w, 24, 12);
    ctx.fill();
    ctx.strokeStyle = "rgba(90,60,20,0.45)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(ctx, ing.name, cx, y, { size: 14, bold: true, align: "center", color: "#3d2c14" });
  });
  text(ctx, "YOUR PLATE", cx, cy + 128, { size: 16, bold: true, align: "center", color: "#6b4f2a" });
}

function drawGrill(ctx, world) {
  ctx.fillStyle = "#374151";
  roundRect(ctx, 880, 96, 368, 168, 12);
  ctx.fill();
  text(ctx, "GRILL", 1064, 116, { size: 18, bold: true, align: "center", color: "#ffd98a" });
  GRILL_BOXES.forEach((box, i) => {
    const item = world.grill[i];
    ctx.fillStyle = "#111827";
    roundRect(ctx, box.x, box.y, box.w, box.h, 10);
    ctx.fill();
    if (!item) {
      text(ctx, "empty", box.x + box.w / 2, box.y + box.h / 2, { size: 15, align: "center", color: "#9ca3af" });
      return;
    }
    const ing = INGREDIENT_BY_ID[item.id];
    ctx.fillStyle = item.state === "burnt" ? "#1f2937" : ing.color;
    ctx.beginPath();
    ctx.ellipse(box.x + box.w / 2, box.y + 44, 52, 22, 0, 0, Math.PI * 2);
    ctx.fill();
    const label =
      item.state === "cooking" ? `${ing.name}… ${Math.ceil(item.cookLeft)}s` :
      item.state === "done" ? `${ing.name} DONE!` : `${ing.name} BURNT`;
    text(ctx, label, box.x + box.w / 2, box.y + 84, {
      size: 15, bold: true, align: "center",
      color: item.state === "done" ? "#7ac74f" : item.state === "burnt" ? "#e5484d" : "#ffffff",
    });
  });
}

function drawButtons(ctx, world) {
  ctx.fillStyle = "#2f9e44";
  roundRect(ctx, SERVE_BOX.x, SERVE_BOX.y, SERVE_BOX.w, SERVE_BOX.h, 12);
  ctx.fill();
  if (world && matchingOrderIndex(world) !== -1) {
    ctx.strokeStyle = "#ffd43b";
    ctx.lineWidth = 5;
    roundRect(ctx, SERVE_BOX.x - 4, SERVE_BOX.y - 4, SERVE_BOX.w + 8, SERVE_BOX.h + 8, 14);
    ctx.stroke();
  }
  text(ctx, "SERVE ⏎", SERVE_BOX.x + SERVE_BOX.w / 2, SERVE_BOX.y + SERVE_BOX.h / 2, { size: 20, bold: true, align: "center", color: "#ffffff" });
  ctx.fillStyle = "#868e96";
  roundRect(ctx, CLEAR_BOX.x, CLEAR_BOX.y, CLEAR_BOX.w, CLEAR_BOX.h, 12);
  ctx.fill();
  text(ctx, "CLEAR", CLEAR_BOX.x + CLEAR_BOX.w / 2, CLEAR_BOX.y + CLEAR_BOX.h / 2, { size: 20, bold: true, align: "center", color: "#ffffff" });
  text(ctx, "Click a grill slot to plate a cooked item.", 1064, 396, { size: 14, align: "center", color: "#6b4f2a" });
  text(ctx, "Cooked items burn if they sit too long!", 1064, 420, { size: 14, align: "center", color: "#6b4f2a" });
}

function drawCounter(ctx, world) {
  BIN_BOXES.forEach((box) => {
    const ing = INGREDIENT_BY_ID[box.id];
    ctx.fillStyle = "#fffaf0";
    roundRect(ctx, box.x, box.y, box.w, box.h, 12);
    ctx.fill();
    ctx.strokeStyle = "#8a6d3b";
    ctx.lineWidth = 2;
    ctx.stroke();
    ctx.fillStyle = ing.bin;
    roundRect(ctx, box.x + 14, box.y + 14, box.w - 28, 52, 10);
    ctx.fill();
    ctx.strokeStyle = "rgba(90,60,20,0.4)";
    ctx.lineWidth = 1.5;
    ctx.stroke();
    text(ctx, ing.name, box.x + box.w / 2, box.y + 40, { size: 20, bold: true, align: "center" });
    text(ctx, ing.cook ? `press ${ing.key} · to grill` : `press ${ing.key} · to plate`,
      box.x + box.w / 2, box.y + 92, { size: 15, align: "center", color: "#6b4f2a" });
  });
}

function drawMessage(ctx, world) {
  if (world.messageT <= 0 || !world.message) return;
  text(ctx, world.message, 605, 584, { size: 19, bold: true, align: "center", color: "#43302a" });
}

function drawOverlay(ctx, world) {
  ctx.fillStyle = "rgba(43, 30, 20, 0.72)";
  ctx.fillRect(0, 0, WIDTH, HEIGHT);
  ctx.fillStyle = "#fffaf0";
  roundRect(ctx, 340, 190, 600, 400, 18);
  ctx.fill();
  if (world.screen === "title") {
    text(ctx, "TINY KITCHEN RUSH", 640, 260, { size: 40, bold: true, align: "center" });
    text(ctx, "Read the ticket. Grill what needs grilling.", 640, 330, { size: 20, align: "center" });
    text(ctx, "Stack the plate. Serve before patience runs out.", 640, 362, { size: 20, align: "center" });
    text(ctx, "Keys 1–6 add ingredients · Enter serves · C clears", 640, 420, { size: 17, align: "center", color: "#6b4f2a" });
    text(ctx, "Click or press Enter to open the kitchen", 640, 500, { size: 22, bold: true, align: "center", color: "#2f9e44" });
  } else {
    text(ctx, "SHIFT OVER!", 640, 260, { size: 40, bold: true, align: "center" });
    text(ctx, `Final score: ${world.score}`, 640, 340, { size: 26, bold: true, align: "center" });
    text(ctx, `Dishes served: ${world.served} · Customers lost: ${world.lost}`, 640, 386, { size: 20, align: "center" });
    text(ctx, "Press R to work another shift", 640, 500, { size: 22, bold: true, align: "center", color: "#2f9e44" });
  }
}

export function render(ctx, world) {
  drawBackground(ctx);
  drawHud(ctx, world);
  drawOrderBoard(ctx, world);
  drawPlate(ctx, world);
  drawGrill(ctx, world);
  drawButtons(ctx, world);
  drawCounter(ctx, world);
  drawMessage(ctx, world);
  if (world.screen !== "play") drawOverlay(ctx, world);
}
