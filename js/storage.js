
// LocalStorage keys. One place, so renaming is easy.
const STORAGE_KEYS = {
  cart: "vibeshopping_cart",
  favorites: "vibeshopping_favorites",
  orders: "vibeshopping_orders",
  theme: "vibeshopping_theme",
  customer: "vibeshopping_customer",
};

// Read a JSON value from LocalStorage, or return a fallback
// when nothing was saved yet 
function readStorage(key, fallback) {
  try {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : fallback;
  } catch (error) {
    return fallback;
  }
}

// Save any value to LocalStorage as JSON.
function writeStorage(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    // Storage may be full or blocked — the page still works.
  }
}

// Tell every open page that the cart changed (header counts update).
function notifyCartChanged(lines) {
  document.dispatchEvent(new CustomEvent("vibe:cart", { detail: lines }));
}

// Tell every open page that the favorites changed.
function notifyFavoritesChanged(ids) {
  document.dispatchEvent(new CustomEvent("vibe:favorites", { detail: ids }));
}

// ---- Favorites: a simple list of product ids ----

function loadFavorites() {
  return readStorage(STORAGE_KEYS.favorites, []);
}

function isFavorite(id) {
  return loadFavorites().some((saved) => String(saved) === String(id));
}

function addToFavorites(id) {
  if (isFavorite(id)) {
    return;
  }
  const ids = loadFavorites();
  ids.push(Number(id) || id);
  saveFavorites(ids);
}

function removeFromFavorites(id) {
  const ids = loadFavorites().filter((saved) => String(saved) !== String(id));
  saveFavorites(ids);
}

function saveFavorites(ids) {
  writeStorage(STORAGE_KEYS.favorites, ids);
  notifyFavoritesChanged(ids);
}

// ---- Shopping cart: [{ id, qty, snapshot }] ----
// The snapshot (title, price, photo) is stored with each line
// so the cart and checkout pages can render without the API.

function loadCart() {
  return readStorage(STORAGE_KEYS.cart, []);
}

function saveCart(lines) {
  writeStorage(STORAGE_KEYS.cart, lines);
  notifyCartChanged(lines);
}

// Add a product; buying the same product twice increases quantity
// instead of creating a second line.
function addToCart(product, quantity = 1) {
  const lines = loadCart();
  const snapshot = {
    title: product.title,
    price: product.price,
    image: product.images ? product.images[0] : "",
    category: product.category,
  };

  const existing = lines.find((line) => String(line.id) === String(product.id));

  if (existing) {
    existing.qty = Math.min(99, (existing.qty || 0) + quantity);
    existing.snapshot = snapshot;
  } else {
    lines.push({ id: product.id, qty: quantity, snapshot: snapshot });
  }

  saveCart(lines);
}

// Change a line's quantity (0 or less removes the line).
function updateCartQuantity(id, quantity) {
  let lines = loadCart();
  if (quantity <= 0) {
    lines = lines.filter((line) => String(line.id) !== String(id));
  } else {
    const line = lines.find((l) => String(l.id) === String(id));
    if (line) {
      line.qty = Math.min(99, quantity);
    }
  }
  saveCart(lines);
}

function removeFromCart(id) {
  updateCartQuantity(id, 0);
}

function clearCart() {
  saveCart([]);
}

// Total number of items in the cart (for the header badge).
function countCartItems() {
  return loadCart().reduce((sum, line) => sum + (line.qty || 0), 0);
}

// Total price of everything in the cart.
function getCartSubtotal() {
  return loadCart().reduce(
    (sum, line) => sum + (line.qty || 0) * (Number(line.snapshot.price) || 0),
    0
  );
}

// ---- Orders: saved at checkout, shown in order history ----

function loadOrders() {
  return readStorage(STORAGE_KEYS.orders, []);
}

function saveOrders(orders) {
  writeStorage(STORAGE_KEYS.orders, orders);
}

// Create an order from the cart, save it, then empty the cart.
// The total is clamped at zero so a 100% discount can never
// produce a negative total.
function createOrder(customer, items, subtotal, shipping, promoCode = "") {
  const order = {
    id:
      "VS-" +
      Date.now().toString(36).toUpperCase() +
      Math.floor(Math.random() * 90 + 10),
    date: new Date().toISOString(),
    status: "Confirmed",
    customer: customer,
    items: items,
    subtotal: subtotal,
    shipping: shipping,
    promoCode: promoCode,
    total: Math.max(0, subtotal + shipping),
  };

  const orders = loadOrders();
  orders.unshift(order); // newest order first
  saveOrders(orders);

  saveCustomer(customer);
  clearCart();

  return order;
}

// ---- Saved customer (checkout form remembers the last buyer) ----

function loadCustomer() {
  return readStorage(STORAGE_KEYS.customer, {
    name: "",
    email: "",
    phone: "",
    address: "",
    city: "",
    zip: "",
  });
}

function saveCustomer(customer) {
  writeStorage(STORAGE_KEYS.customer, customer);
}

// ---- Small formatting helpers ----

const priceFormatter = new Intl.NumberFormat("en-US", {
  style: "currency",
  currency: "USD",
});

// Format a number as dollars, e.g. 44 -> "$44.00".
function formatPrice(value) {
  return priceFormatter.format(Number(value) || 0);
}

// Format an ISO date as "Oct 4, 2026".
function formatDate(isoDate) {
  try {
    return new Date(isoDate).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  } catch (error) {
    return isoDate;
  }
}

// Escape text before putting it into HTML (prevents broken markup).
function escapeHtml(text) {
  return String(text ?? "").replace(
    /[&<>"']/g,
    (char) =>
      ({
        "&": "&amp;",
        "<": "&lt;",
        ">": "&gt;",
        '"': "&quot;",
        "'": "&#39;",
      }[char])
  );
}

// Shared Store object used by every page.
const Store = {
  loadFavorites,
  isFavorite,
  addToFavorites,
  removeFromFavorites,
  loadCart,
  addToCart,
  updateCartQuantity,
  removeFromCart,
  clearCart,
  countCartItems,
  getCartSubtotal,
  loadOrders,
  createOrder,
  loadCustomer,
  saveCustomer,
  formatPrice,
  formatDate,
  escapeHtml,
};
window.Store = Store;
