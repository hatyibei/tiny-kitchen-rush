// input.js — keyboard and mouse controls. Keys 1–6 add ingredients,
// Enter serves, C clears the plate; clicks hit-test the layout boxes
// from render.js (bins, grill slots, buttons).

import { INGREDIENTS } from "./config.js";
import { BIN_BOXES, CLEAR_BOX, GRILL_BOXES, SERVE_BOX } from "./render.js";
import { addIngredient, clearPlate, servePlate, startShift, takeFromGrill } from "./world.js";

function inBox(x, y, box) {
  return x >= box.x && x <= box.x + box.w && y >= box.y && y <= box.y + box.h;
}

export function attachInput(canvas, world) {
  window.addEventListener("keydown", (event) => {
    if (world.screen === "title" && (event.key === "Enter" || event.key === " ")) {
      startShift(world);
      return;
    }
    if (world.screen === "over" && (event.key === "r" || event.key === "R")) {
      startShift(world);
      return;
    }
    if (world.screen !== "play") return;
    const ing = INGREDIENTS.find((i) => i.key === event.key);
    if (ing) addIngredient(world, ing.id);
    else if (event.key === "Enter") servePlate(world);
    else if (event.key === "c" || event.key === "C") clearPlate(world);
  });

  canvas.addEventListener("click", (event) => {
    const rect = canvas.getBoundingClientRect();
    const x = ((event.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((event.clientY - rect.top) / rect.height) * canvas.height;
    if (world.screen !== "play") {
      startShift(world);
      return;
    }
    const bin = BIN_BOXES.find((b) => inBox(x, y, b));
    if (bin) return addIngredient(world, bin.id);
    const slot = GRILL_BOXES.findIndex((b) => inBox(x, y, b));
    if (slot !== -1) return takeFromGrill(world, slot);
    if (inBox(x, y, SERVE_BOX)) return servePlate(world);
    if (inBox(x, y, CLEAR_BOX)) return clearPlate(world);
  });
}
