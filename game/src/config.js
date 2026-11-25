// config.js — the menu, the ingredients and the shift rules for
// Tiny Kitchen Rush. Pure data; no game logic lives here.

export const WIDTH = 1280;
export const HEIGHT = 800;

export const SHIFT_SECONDS = 90;      // one shift lasts 90 seconds
export const MAX_ORDERS = 3;          // order board slots
export const COOK_SECONDS = 6;        // grill time before an item is done
export const BURN_SECONDS = 5;        // extra grill time before it burns
export const FIRST_ORDER_DELAY = 0.5; // seconds until the first ticket
export const ORDER_GAP_SECONDS = 7;   // seconds between new tickets

// Ingredients on the counter. `cook: true` items must go on the grill
// before they can be plated. `color` is the fill used when the item is
// drawn on the plate; `bin` is the counter label colour.
export const INGREDIENTS = [
  { id: "bun",     name: "Bun",     key: "1", cook: false, color: "#e8b04b", bin: "#f3d27a" },
  { id: "patty",   name: "Patty",   key: "2", cook: true,  color: "#8a4b2a", bin: "#c98a5a" },
  { id: "cheese",  name: "Cheese",  key: "3", cook: false, color: "#f7c948", bin: "#ffe08a" },
  { id: "lettuce", name: "Lettuce", key: "4", cook: false, color: "#57ab5a", bin: "#9be29b" },
  { id: "tomato",  name: "Tomato",  key: "5", cook: false, color: "#e5484d", bin: "#ff9a9e" },
  { id: "egg",     name: "Egg",     key: "6", cook: true,  color: "#f5f0dc", bin: "#fff6c9" },
];

export const INGREDIENT_BY_ID = Object.fromEntries(
  INGREDIENTS.map((ing) => [ing.id, ing]),
);

// The dishes customers order. `items` lists ingredient ids in plating
// order; cookable items are understood to be served cooked.
export const RECIPES = [
  { name: "Classic Burger",  items: ["bun", "patty", "cheese", "lettuce"], price: 100 },
  { name: "Garden Burger",   items: ["bun", "lettuce", "tomato", "cheese"], price: 90 },
  { name: "Sunrise Plate",   items: ["egg", "cheese", "tomato"],            price: 80 },
  { name: "Double Stack",    items: ["bun", "patty", "patty", "cheese"],    price: 130 },
  { name: "Green Stack",     items: ["bun", "lettuce", "cheese", "tomato"], price: 95 },
];

// Patience (seconds) a ticket waits before the customer walks out.
export const PATIENCE_SECONDS = 45;
