// world.js — the state of one shift and the rules that move it:
// tickets arrive, patties cook and burn, plates are built and served.

import {
  BURN_SECONDS,
  COOK_SECONDS,
  FIRST_ORDER_DELAY,
  INGREDIENT_BY_ID,
  MAX_ORDERS,
  ORDER_GAP_SECONDS,
  PATIENCE_SECONDS,
  RECIPES,
  SHIFT_SECONDS,
} from "./config.js";
import { makeRng, pick } from "./random.js";

export function createWorld(seed = 20261125) {
  return {
    screen: "title", // title | play | over
    rng: makeRng(seed),
    timeLeft: SHIFT_SECONDS,
    score: 0,
    served: 0,
    lost: 0,
    orders: [], // { recipe, patienceLeft }
    nextOrderIn: FIRST_ORDER_DELAY,
    plate: [], // ingredient ids, cooked where the recipe needs them cooked
    grill: [null, null], // null | { id, cookLeft, burnLeft, state }
    message: "",
    messageT: 0,
    shakeT: 0,
    lastServe: null, // { name, gained } for the serve flash
  };
}

export function startShift(world) {
  const fresh = createWorld((Math.random() * 1e9) | 0);
  Object.assign(world, fresh, { screen: "play" });
  say(world, "First ticket incoming — good luck, chef!");
}

function say(world, text) {
  world.message = text;
  world.messageT = 3;
}

export function spawnOrder(world) {
  if (world.orders.length >= MAX_ORDERS) return;
  const recipe = pick(world.rng, RECIPES);
  world.orders.push({ recipe, patienceLeft: PATIENCE_SECONDS });
}

export function addIngredient(world, id) {
  const ing = INGREDIENT_BY_ID[id];
  if (!ing) return;
  if (ing.cook) {
    const slot = world.grill.findIndex((s) => s === null);
    if (slot === -1) {
      say(world, "The grill is full!");
      return;
    }
    world.grill[slot] = { id, cookLeft: COOK_SECONDS, burnLeft: BURN_SECONDS, state: "cooking" };
    say(world, `${ing.name} on the grill…`);
    return;
  }
  world.plate.push(id);
}

export function takeFromGrill(world, slot) {
  const item = world.grill[slot];
  if (!item) return;
  if (item.state === "cooking") {
    say(world, "Still raw — give it a moment.");
    return;
  }
  if (item.state === "burnt") {
    world.grill[slot] = null;
    say(world, "Burnt. Tossed in the bin.");
    return;
  }
  world.grill[slot] = null;
  world.plate.push(item.id);
  say(world, `${INGREDIENT_BY_ID[item.id].name} plated.`);
}

export function clearPlate(world) {
  if (world.plate.length === 0) return;
  world.plate = [];
  say(world, "Plate cleared.");
}

function samePlate(a, b) {
  if (a.length !== b.length) return false;
  const counts = new Map();
  for (const x of a) counts.set(x, (counts.get(x) ?? 0) + 1);
  for (const x of b) {
    const n = (counts.get(x) ?? 0) - 1;
    if (n < 0) return false;
    counts.set(x, n);
  }
  return true;
}

// Index of the ticket the current plate would satisfy, or -1. The
// renderer uses it to highlight the matching ticket and the SERVE
// button, so the player can see a dish is ready at a glance.
export function matchingOrderIndex(world) {
  if (world.plate.length === 0) return -1;
  return world.orders.findIndex((o) => samePlate(world.plate, o.recipe.items));
}

export function servePlate(world) {
  if (world.plate.length === 0) {
    say(world, "The plate is empty — build a dish first.");
    return;
  }
  const idx = world.orders.findIndex((o) => samePlate(world.plate, o.recipe.items));
  if (idx === -1) {
    world.shakeT = 0.35;
    say(world, "No ticket matches this plate.");
    return;
  }
  const [order] = world.orders.splice(idx, 1);
  const tip = Math.round((order.patienceLeft / PATIENCE_SECONDS) * 40);
  const gained = order.recipe.price + tip;
  world.score += gained;
  world.served += 1;
  world.plate = [];
  world.lastServe = { name: order.recipe.name, gained };
  say(world, `Served ${order.recipe.name}! +${gained} (tip +${tip})`);
}

export function update(world, dt) {
  if (world.messageT > 0) world.messageT -= dt;
  if (world.shakeT > 0) world.shakeT -= dt;
  if (world.screen !== "play") return;

  world.timeLeft -= dt;
  if (world.timeLeft <= 0) {
    world.timeLeft = 0;
    world.screen = "over";
    return;
  }

  world.nextOrderIn -= dt;
  if (world.nextOrderIn <= 0) {
    spawnOrder(world);
    world.nextOrderIn = ORDER_GAP_SECONDS;
  }

  for (const order of world.orders) order.patienceLeft -= dt;
  const before = world.orders.length;
  world.orders = world.orders.filter((o) => o.patienceLeft > 0);
  if (world.orders.length < before) {
    world.lost += before - world.orders.length;
    say(world, "A customer walked out…");
  }

  for (const slot of world.grill) {
    if (!slot) continue;
    if (slot.state === "cooking") {
      slot.cookLeft -= dt;
      if (slot.cookLeft <= 0) slot.state = "done";
    } else if (slot.state === "done") {
      slot.burnLeft -= dt;
      if (slot.burnLeft <= 0) slot.state = "burnt";
    }
  }
}

// Fixed scenes used for the screenshots (?shot=1|2|3). Each returns a
// world frozen in a state that shows the game off.
export function demoWorld(shot) {
  const world = createWorld(7);
  world.screen = "play";
  world.timeLeft = 63;
  world.score = 240;
  world.served = 2;
  world.orders = [
    { recipe: RECIPES[0], patienceLeft: 31 },
    { recipe: RECIPES[2], patienceLeft: 38 },
  ];
  if (shot === 1) {
    world.screen = "title";
    world.orders = [{ recipe: RECIPES[0], patienceLeft: 40 }];
    world.score = 0;
    world.served = 0;
  }
  if (shot === 2) {
    world.plate = ["bun"];
    world.grill[0] = { id: "patty", cookLeft: 2.5, burnLeft: BURN_SECONDS, state: "cooking" };
    say(world, "Patty on the grill…");
    world.messageT = 999;
  }
  if (shot === 3) {
    world.plate = ["bun", "patty", "cheese", "lettuce"];
    world.lastServe = null;
    say(world, "Classic Burger ready — hit SERVE!");
    world.messageT = 999;
  }
  return world;
}
