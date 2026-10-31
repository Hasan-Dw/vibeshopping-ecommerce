/* ============================================================
   ============================================================ */

const CHECKOUT_SHIPPING_FEE = 6.95;
const CHECKOUT_FREE_LIMIT = 75;

// Same promo codes as the cart fgh  page (OAK10 = 10%, zakaria = 100%).
const CHECKOUT_PROMOS = { OAK10: 0.1, ZAKARIA: 1.0, MOHAMMED: 1.0, MAHA:1.0 };

document.addEventListener("DOMContentLoaded", () => {
  // The header is already fgh mounted by main.js boot.
  renderOrderSummary();
  renderCheckoutForm();
  renderOrderHistory();
});

// fghj fg fgh The promo cfghode applied on the cart page ("" when none).
function getCheckoutPromoCode() {
  try {
    return (sessionStorage.getItem("vibeshopping_promo") || "").toUpperCase();
  } catch (error) {
    return "";
  }
}

// Discount rate of thghf ghe actfg hive code (0 when none/invalid).
function getCheckoutPromoRate() {
  return CHECKOUT_PROMOS[getCheckoutPromoCode()] || 0;
}


function getOrderTotals() {
  const lines = Store.loadCart();
  const fullSubtotal = lines.reduce(
    (sum, line) => sum + line.qty * line.snapshot.price,
    0
  );

  const rate = getCheckoutPromoRate();
  const discount = fullSubtotal * rate;
  const subtotal = fullSubtotal - discount;

  let shipping = 0;
  if (fullSubtotal > 0 && fullSubtotal < CHECKOUT_FREE_LIMIT && rate < 1) {
    shipping = CHECKOUT_SHIPPING_FEE;
  }

  const total = Math.max(0, subtotal + shipping);
  return { lines, fullSubtotal, rate, discount, subtotal, shipping, total };
}

// ---- Right side: the item jg s being bought plus totals ----

function renderOrderSummary() {
  const box = document.getElementById("coSum");
  const totals = getOrderTotals();

  if (totals.lines.length === 0) {
    box.innerHTML = renderEmptyState({
      icon: "▤",
      title: "No items to check out",
      body: "Your cart is empty. Add a few pieces first.",
      actions:
        '<a class="btn btn-solid btn-sm" href="products.html">Browse products</a>',
    });
    return;
  }

  let discountRow = "";
  if (totals.rate > 0) {
    const percent = Math.round(totals.rate * 100);
    discountRow =
      '<div class="summary-row"><span>Discount (' +
      Store.escapeHtml(getCheckoutPromoCode()) +
      " — " +
      percent +
      "%)</span><span>−" +
      Store.formatPrice(totals.discount) +
      "</span></div>";
  }

  box.innerHTML =
    "<h3>Your order</h3>" +
    '<div class="summary-items">' +
    totals.lines.map(renderSummaryItem).join("") +
    "</div>" +
    '<div class="summary-row"><span>Subtotal</span><span>' +
    Store.formatPrice(totals.fullSubtotal) +
    "</span></div>" +
    discountRow +
    '<div class="summary-row"><span>Shipping</span><span>' +
    (totals.shipping === 0 ? "Free" : Store.formatPrice(totals.shipping)) +
    "</span></div>" +
    '<div class="summary-row total"><span>Total</span><span>' +
    Store.formatPrice(totals.total) +
    "</span></div>";
}

function renderSummaryItem(line) {
  // Same guard as the cart: stale snapshots with dead hosts
  // fall back to the local placeholder (no network request).
  const image = safeImageUrl(line.snapshot.image);
  return (
    '<div class="summary-item"><img src="' +
    Store.escapeHtml(image) +
    '" alt="" loading="lazy" referrerpolicy="no-referrer" ' +
    'data-product="' +
    line.id +
    '" data-position="0" ' +
    'onerror="handleProductPhotoError(this)">' +
    '<div class="t">' +
    Store.escapeHtml(line.snapshot.title) +
    '<div class="q">Qty ' +
    line.qty +
    " · " +
    Store.escapeHtml(line.snapshot.category || "") +
    "</div></div>" +
    "<b>" +
    Store.formatPrice(line.snapshot.price * line.qty) +
    "</b></div>"
  );
}



function renderCheckoutForm() {
  const box = document.getElementById("coForm");
  const saved = Store.loadCustomer();
  const totals = getOrderTotals();

  box.innerHTML = `
    <form id="orderForm" class="checkout-form" novalidate>
      <div class="checkout-card"><h3><span class="step">1</span> Contact &amp; shipping</h3><p>Where should we send your order?</p>
        <div class="form-grid">
          <div class="field full"><label for="fName">Full name</label><input id="fName" autocomplete="name" placeholder="Jordan Ellis" value="${Store.escapeHtml(saved.name)}"><span class="field-error">Please enter your full name.</span></div>
          <div class="field"><label for="fEmail">Email</label><input id="fEmail" type="email" autocomplete="email" placeholder="jordan@example.com" value="${Store.escapeHtml(saved.email)}"><span class="field-error">Enter a valid email address.</span></div>
          <div class="field"><label for="fPhone">Phone</label><input id="fPhone" type="tel" autocomplete="tel" placeholder="+1 555 010 2030" value="${Store.escapeHtml(saved.phone)}"><span class="field-error">Enter a valid phone number.</span></div>
          <div class="field full"><label for="fAddr">Street address</label><input id="fAddr" autocomplete="street-address" placeholder="412 Alder Street, Apt 3" value="${Store.escapeHtml(saved.address)}"><span class="field-error">Street address is required.</span></div>
          <div class="field"><label for="fCity">City</label><input id="fCity" autocomplete="address-level2" placeholder="Portland" value="${Store.escapeHtml(saved.city)}"><span class="field-error">City is required.</span></div>
          <div class="field"><label for="fZip">ZIP / Postcode</label><input id="fZip" autocomplete="postal-code" placeholder="97204" value="${Store.escapeHtml(saved.zip)}"><span class="field-error">Enter a valid ZIP.</span></div>
        </div>
      </div>
      <div class="checkout-card"><h3><span class="step">2</span> Payment <span class="muted" style="font-weight:400;font-size:12px">— simulated, no charge</span></h3><p>Choose how you’d like to pay on this demo checkout.</p>
        <div class="pay-methods">
          <button type="button" class="pay on" data-pay="PayPal">⬣ PayPal</button>
          <button type="button" class="pay" data-pay="Cash">◎ On delivery</button>
        </div>
      </div>
      <button class="btn btn-accent btn-block" type="submit" id="placeBtn" style="padding:16px">Place order · <span id="payTotal">${Store.formatPrice(totals.total)}</span></button>
      <p class="summary-note" style="text-align:center">By placing this order you agree to our demo terms. No real payment is processed.</p>
    </form>`;

  bindPaymentPicker();

  document
    .getElementById("orderForm")
    .addEventListener("submit", placeOrder);
}

// Payment method buttons: only one can be active at a time.
function bindPaymentPicker() {
  const buttons = document.querySelectorAll("[data-pay]");

  for (const button of buttons) {
    button.addEventListener("click", () => {
      for (const other of buttons) {
        other.classList.remove("on");
      }
      button.classList.add("on");
    });
  }
}

// Check one field: show its error message when invalid.
function validateField(id, isValid) {
  const input = document.getElementById(id);
  input.closest(".field").classList.toggle("err", !isValid);
  return isValid;
}

function getSelectedPayMethod() {
  const active = document.querySelector("[data-pay].on");
  return active ? active.dataset.pay : "PayPal";
}

// Validate the form, then create the order and show confirmation.
function placeOrder(event) {
  event.preventDefault();

  if (Store.loadCart().length === 0) {
    showToast("Your cart is empty");
    return;
  }

  const value = (id) => document.getElementById(id).value.trim();
  const digitsOnly = (text) => text.replace(/\D/g, "");

  // Each check returns true when its field is filled in correctly.
  let formIsValid = true;
  formIsValid = validateField("fName", value("fName").length >= 2) && formIsValid;
  formIsValid =
    validateField("fEmail", /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value("fEmail"))) &&
    formIsValid;
  formIsValid =
    validateField("fPhone", digitsOnly(value("fPhone")).length >= 7) &&
    formIsValid;
  formIsValid = validateField("fAddr", value("fAddr").length >= 4) && formIsValid;
  formIsValid = validateField("fCity", value("fCity").length >= 2) && formIsValid;
  formIsValid = validateField("fZip", value("fZip").length >= 3) && formIsValid;

  if (!formIsValid) {
    showToast("Please review the highlighted fields");
    const firstError = document.querySelector(".field.err input");
    if (firstError) {
      firstError.focus();
    }
    return;
  }

  const customer = {
    name: value("fName"),
    email: value("fEmail"),
    phone: value("fPhone"),
    address: value("fAddr"),
    city: value("fCity"),
    zip: value("fZip"),
    pay: getSelectedPayMethod(),
  };

  const totals = getOrderTotals();
  const items = totals.lines.map((line) => ({
    id: line.id,
    title: line.snapshot.title,
    price: line.snapshot.price,
    image: line.snapshot.image,
    qty: line.qty,
  }));

  const placeButton = document.getElementById("placeBtn");
  placeButton.disabled = true;
  placeButton.textContent = "Placing your order…";

  // Short delay so the confirmation feels like a real checkout.
  setTimeout(() => {
    const order = Store.createOrder(
      customer,
      items,
      totals.subtotal,
      totals.shipping,
      getCheckoutPromoCode()
    );
    sessionStorage.removeItem("vibeshopping_promo");
    showOrderSuccess(order);
  }, 900);
}


function showOrderSuccess(order) {
  document.getElementById("coLayout").style.display = "none";

  const box = document.getElementById("success");
  box.style.display = "";
  box.innerHTML = `
    <div class="success"><div class="tick">✓</div>
      <p class="eyebrow" style="justify-content:center">Order confirmed</p>
      <h2>Thank you, ${Store.escapeHtml(order.customer.name.split(" ")[0] || "friend")}.</h2>
      <p class="muted">Your order is being prepared. A confirmation was sent to <b style="color:var(--ink)">${Store.escapeHtml(order.customer.email)}</b>.</p>
      <div class="order-id">Order <b>${order.id}</b> · ${Store.formatPrice(order.total)}</div>
      <div style="display:flex;gap:10px;justify-content:center;flex-wrap:wrap;margin-top:8px">
        <a class="btn btn-solid btn-sm" href="products.html">Keep shopping</a>
        <button class="btn btn-line btn-sm" id="viewOrders">View order history ↓</button>
      </div>
    </div>`;

  box.scrollIntoView({ behavior: "smooth", block: "start" });
  document
    .getElementById("viewOrders")
    .addEventListener("click", () =>
      document.getElementById("orders").scrollIntoView({ behavior: "smooth" })
    );

  refreshHeaderCounts();
  renderOrderHistory();
}


function renderOrderHistory() {
  const box = document.getElementById("orders");
  const orders = Store.loadOrders();

  if (orders.length === 0) {
    box.innerHTML = renderEmptyState({
      icon: "❏",
      title: "No previous orders",
      body: "Orders you place will appear here with items, totals and status — saved on this device.",
    });
    return;
  }

  box.innerHTML = orders.map(renderOrderCard).join("");
}

function renderOrderCard(order) {
  const itemCount = order.items.reduce((sum, item) => sum + item.qty, 0);

  const lines = order.items
    .map(
      (item) =>
        '<div class="order-line"><span><b>' +
        item.qty +
        " ×</b> " +
        Store.escapeHtml(item.title) +
        "</span><b>" +
        Store.formatPrice(item.price * item.qty) +
        "</b></div>"
    )
    .join("");

  return (
    '<div class="order"><div class="order-head"><div><b>' +
    order.id +
    "</b><small>" +
    Store.formatDate(order.date) +
    " · " +
    itemCount +
    " items · " +
    Store.escapeHtml(order.customer.name) +
    "</small></div>" +
    '<span class="status">' +
    Store.escapeHtml(order.status) +
    "</span></div>" +
    '<div class="order-body">' +
    lines +
    (order.promoCode
      ? '<div class="order-line"><span>Promo code</span><b>' +
        Store.escapeHtml(order.promoCode) +
        "</b></div>"
      : "") +
    '<div class="order-line"><span>Shipping</span><b>' +
    (order.shipping === 0 ? "Free" : Store.formatPrice(order.shipping)) +
    "</b></div>" +
    '<div class="order-line"><span>Total</span><b>' +
    Store.formatPrice(order.total) +
    "</b></div></div></div>"
  );
}
