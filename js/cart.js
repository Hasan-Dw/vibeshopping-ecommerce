

// Free shipping threshold and flat shipping fee.
const FREE_SHIPPING_LIMIT = 75;
const SHIPPING_FEE = 6.95;

const PROMO_CODES = { OAK10: 0.1, ZAKARIA: 1.0 , MOHAMMED: 1.0, MAHA:1.0 };


function getPromoCode() {
  try {
    return (sessionStorage.getItem("vibeshopping_promo") || "").toUpperCase();
  } catch (error) {
    return "";
  }
}

function getPromoRate() {
  return PROMO_CODES[getPromoCode()] || 0;
}

function getCartTotals() {
  const subtotal = Store.getCartSubtotal();
  const rate = getPromoRate();
  const discount = subtotal * rate;

  let shipping = 0;
  if (subtotal > 0 && subtotal < FREE_SHIPPING_LIMIT && rate < 1) {
    shipping = SHIPPING_FEE;
  }

  const total = Math.max(0, subtotal - discount + shipping);
  return { subtotal, rate, discount, shipping, total };
}

document.addEventListener("DOMContentLoaded", () => {
  // The header is already mounted by main.js boot.
  renderCart();

  // Re-render whenever the cart changes (even from another page).
  document.addEventListener("vibe:cart", renderCart);
});

function renderCart() {
  const box = document.getElementById("cartBox");
  const lines = Store.loadCart();


  if (lines.length === 0) {
    box.innerHTML = renderEmptyState({
      icon: "▤",
      title: "Your cart is empty",
      body: "Beautiful objects are waiting. Start with our best-rated pieces or browse the full catalog.",
      actions:
        '<a class="btn btn-solid btn-sm" href="products.html">Browse products</a>' +
        '<a class="btn btn-line btn-sm" href="favorites.html">View favorites</a>',
    });
    return;
  }

  const totals = getCartTotals();
  const subtotal = totals.subtotal;
  const shipping = totals.shipping;
  const itemCount = Store.countCartItems();

  // Discount row is visible only while a valid code is active.
  let discountRow = "";
  if (totals.rate > 0) {
    const percent = Math.round(totals.rate * 100);
    discountRow =
      '<div class="summary-row"><span>Discount (' +
      Store.escapeHtml(getPromoCode()) +
      " — " +
      percent +
      "%)</span><span>−" +
      Store.formatPrice(totals.discount) +
      "</span></div>";
  }

  const shippingHint =
    shipping === 0
      ? "you’ve unlocked <b>free shipping</b>"
      : "add <b>" +
        Store.formatPrice(FREE_SHIPPING_LIMIT - subtotal) +
        "</b> for free shipping";

  box.innerHTML = `
    <div class="cart-layout">
      <div>
        <p class="muted" style="margin-bottom:6px"><b>${itemCount}</b> item${itemCount > 1 ? "s" : ""} · ${shippingHint}</p>
        <div class="cart-list">${lines.map(renderCartRow).join("")}</div>
        <div style="display:flex;gap:10px;margin-top:20px;flex-wrap:wrap">
          <a class="btn btn-line btn-sm" href="products.html">← Continue shopping</a>
          <button class="link-remove" id="clearCart">Clear cart</button>
        </div>
      </div>
      <aside class="order-summary">
        <h3>Order summary</h3>
        <p class="muted" style="font-size:13px">Taxes calculated at checkout.</p>
        <div class="promo"><input id="promo" placeholder="Promo code (try OAK10)" aria-label="Promo code"><button class="btn btn-line btn-sm" id="promoBtn">Apply</button></div>
        <div class="summary-row"><span>Subtotal</span><span>${Store.formatPrice(subtotal)}</span></div>
        ${discountRow}
        <div class="summary-row"><span>Shipping</span><span>${shipping === 0 ? "Free" : Store.formatPrice(shipping)}</span></div>
        <div class="summary-row total"><span>Total</span><span id="cartTotal">${Store.formatPrice(totals.total)}</span></div>
        <p class="summary-note">Free 30-day returns · Carbon-neutral delivery · Secure checkout</p>
        <a class="btn btn-accent btn-block" href="checkout.html">Proceed to checkout →</a>
      </aside>
    </div>`;

  bindCartButtons();
}


function renderCartRow(line) {

  const image = safeImageUrl(line.snapshot.image);
  return `
    <div class="cart-item">
      <a href="product-details.html?id=${line.id}"><img src="${Store.escapeHtml(image)}" alt="${Store.escapeHtml(line.snapshot.title)}" loading="lazy" referrerpolicy="no-referrer" data-product="${line.id}" data-position="0" onerror="handleProductPhotoError(this)"></a>
      <div>
        <div class="cart-item-category">${Store.escapeHtml(line.snapshot.category || "")}</div>
        <a class="cart-item-name" href="product-details.html?id=${line.id}">${Store.escapeHtml(line.snapshot.title)}</a>
        <div class="cart-item-controls">
          <span class="quantity-sm"><button data-dec="${line.id}" aria-label="Decrease">−</button><b>${line.qty}</b><button data-inc="${line.id}" aria-label="Increase">+</button></span>
          <button class="link-remove" data-del="${line.id}">Remove</button>
        </div>
      </div>
      <div class="cart-item-price">${Store.formatPrice(line.snapshot.price * line.qty)}<small>${Store.formatPrice(line.snapshot.price)} each</small></div>
    </div>`;
}

function bindCartButtons() {

  for (const button of document.querySelectorAll("[data-inc]")) {
    button.addEventListener("click", () => {
      const line = Store.loadCart().find(
        (l) => String(l.id) === String(button.dataset.inc)
      );
      Store.updateCartQuantity(button.dataset.inc, (line ? line.qty : 0) + 1);
    });
  }
  for (const button of document.querySelectorAll("[data-dec]")) {
    button.addEventListener("click", () => {
      const line = Store.loadCart().find(
        (l) => String(l.id) === String(button.dataset.dec)
      );
      Store.updateCartQuantity(button.dataset.dec, (line ? line.qty : 0) - 1);
    });
  }
  for (const button of document.querySelectorAll("[data-del]")) {
    button.addEventListener("click", () => {
      Store.removeFromCart(button.dataset.del);
      showToast("Removed from cart");
    });
  }

  const clearButton = document.getElementById("clearCart");
  if (clearButton) {
    clearButton.addEventListener("click", () => {
      Store.clearCart();
      showToast("Cart cleared");
    });
  }

  const promoButton = document.getElementById("promoBtn");
  if (promoButton) {
    promoButton.addEventListener("click", applyPromoCode);
  }
}

// Apply the codghj e typed ihfg  nto the promo field (case-insensitive).
// The code is remembered for thisghj visit; checkout reads it too.
function applyPromoCode() {
  const input = document.getElementById("promo");
  const code = input.value.trim().toUpperCase();

  if (PROMO_CODES[code]) {
    try {
      sessionStorage.setItem("vibeshopping_promo", code);
    } catch (error) {
      // Storage blocked ghj— the discount still shows on this page.
    }
    renderCart();
    const percent = Math.round(PROMO_CODES[code] * 100);
    showToast("Promo applied — " + percent + "% off");
  } else {
    showToast("That code isn’t valid");
  }
}
