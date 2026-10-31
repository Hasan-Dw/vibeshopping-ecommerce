
function getSafeImageUrl(product, position = 0) {
  const images = product.images || [];

  for (let i = position; i < images.length; i++) {
    if (!didImageFail(images[i]) && !isJunkImageUrl(images[i])) {
      return images[i];
    }
  }
  return PLACEHOLDER_IMAGE;
}


function productImageTag(product, position = 0, alt = "") {
  const url = getSafeImageUrl(product, position);
  const text = alt || product.title;
  return (
    '<img src="' +
    Store.escapeHtml(url) +
    '" alt="' +
    Store.escapeHtml(text) +
    '" loading="lazy" referrerpolicy="no-referrer" ' +
    'data-product="' +
    product.id +
    '" data-position="' +
    position +
    '" ' +
    'onerror="handleProductPhotoError(this)">'
  );
}


function themedIcon(name) {
  const suffix = Theme.getTheme() === "dark" ? "-dark" : "";
  return "assets/icons/" + name + suffix + ".svg";
}


// dark variant.
function heartIcon(isFavorite) {
  if (isFavorite) {
    return "assets/icons/heart-filled.svg";
  }
  return themedIcon("heart");
}

function refreshThemeIcons() {
  const icons = document.querySelectorAll("img[data-icon]");
  for (const img of icons) {
    const kind = img.dataset.icon;
    if (kind === "fav") {
      const button = img.closest("[data-fav]");
      const isFav = button ? button.classList.contains("on") : false;
      img.src = heartIcon(isFav);
    } else {
      img.src = themedIcon(kind);
    }
  }
}


/* =========================
   2. Header and footer
   ========================= */

function renderHeader(activePage = "") {
  const cartCount = Store.countCartItems();
  const favCount = Store.loadFavorites().length;

  // Helper: highlight the link of the page we are on.
  function navLink(href, label, key) {
    const active = activePage === key ? ' class="active"' : "";
    return '<a href="' + href + '"' + active + ">" + label + "</a>";
  }

  const favBadge =
    ' <span class="count" data-fav-count' +
    (favCount ? "" : ' style="display:none"') +
    ">" +
    favCount +
    "</span>";

  const cartBadge =
    ' <span class="count" data-cart-count' +
    (cartCount ? "" : ' style="display:none"') +
    ">" +
    cartCount +
    "</span>";

  return `
    <div class="header-inner">
      <a class="brand" href="index.html" aria-label="VibeShopping home">
        <span class="brand-mark">V</span>
        <span class="wordmark">Vibe<em>Shopping</em><small>GOODS &amp; SUPPLY</small></span>
      </a>
      <nav class="navbar" aria-label="Primary">
        ${navLink("index.html", "Home", "home")}${navLink("products.html", "Products", "products")}${navLink("favorites.html", "Favorites", "favorites")}${navLink("cart.html", "Cart", "cart")}${navLink("checkout.html", "Checkout", "checkout")}
      </nav>
      <div class="header-actions">
        <button class="icon-btn" data-theme-btn aria-label="Toggle theme" title="Light / dark">
          <img src="${themedIcon("moon")}" data-icon="moon" alt="">
        </button>
        <a class="icon-btn" href="favorites.html" aria-label="Favorites">
          <img src="${themedIcon("heart")}" data-icon="heart" alt="">${favBadge}
        </a>
        <a class="icon-btn" href="cart.html" aria-label="Cart">
          <img src="${themedIcon("cart")}" data-icon="cart" alt="">${cartBadge}
        </a>
        <button class="icon-btn burger" data-burger aria-label="Open menu" aria-expanded="false">
          <img src="${themedIcon("menu")}" data-icon="menu" alt="">
        </button>
      </div>
    </div>
    <div class="scrim" data-scrim></div>
    <aside class="drawer" data-drawer aria-label="Mobile navigation">
      <div class="drawer-head">
        <b style="font-size:18px">Vibe<em style="font-family:var(--font-editorial);font-weight:400">Shopping</em></b>
        <button class="icon-btn" data-close aria-label="Close menu"><img src="${themedIcon("close")}" data-icon="close" alt=""></button>
      </div>
      <nav>
        <a href="index.html">Home <span>01</span></a>
        <a href="products.html">Products <span>02</span></a>
        <a href="favorites.html">Favorites <span>03</span></a>
        <a href="cart.html">Cart <span>04</span></a>
        <a href="checkout.html">Checkout <span>05</span></a>
      </nav>
      <div class="drawer-foot">Free shipping over $75 · 30-day returns<br>© 2026 VibeShopping Goods &amp; Supply</div>
    </aside>`;
}

function renderFooter() {
  return `
    <div class="wrap">
      <div class="footer-grid">
        <div class="footer-brand">
          <span class="wordmark" style="font-size:30px">Vibe<em>Shopping</em></span>
          <p>Considered goods for everyday rhythm. Designed in small batches, built to be kept — apparel, objects and essentials.</p>
        </div>
        <div class="footer-col"><h5>Shop</h5><a href="products.html">All products</a><a href="products.html?sort=price-asc">Under $50</a><a href="products.html?sort=name-asc">A – Z index</a><a href="favorites.html">Wishlist</a></div>
        <div class="footer-col"><h5>Company</h5><a href="index.html#story">Our story</a><a href="checkout.html">Order history</a><a href="cart.html">Shipping &amp; returns</a></div>
        <div class="footer-col"><h5>Support</h5><a href="checkout.html">Track order</a><a href="cart.html">Cart</a><a href="products.html">Size guide</a><a href="index.html">Contact</a></div>
      </div>
      <div class="footer-big" aria-hidden="true">VIBESHOPPING</div>
      <div class="footer-bottom"><span>© 2026 VibeShopping Goods &amp; Supply Co. All rights reserved.</span><span>Designed by HASAN_DW · Built with vanilla JS & CSS & HTML</span></div>
    </div>`;
}

// Put the header and footer into the page, then apply the theme.
function mountPage(activePage) {
  const headerSlot = document.querySelector("[data-header]");
  if (headerSlot) {
    headerSlot.innerHTML = renderHeader(activePage);
  }

  const footerSlot = document.querySelector("[data-footer]");
  if (footerSlot) {
    footerSlot.innerHTML = renderFooter();
  }

  Theme.applyTheme(Theme.getTheme());
  bindMobileMenu();

  // Keep the header badges correct whenever cart/favorites change.
  document.addEventListener("vibe:cart", refreshHeaderCounts);
  document.addEventListener("vibe:favorites", refreshHeaderCounts);
  refreshHeaderCounts();
}

// Open/close the mobile slide-in menu.
function bindMobileMenu() {
  const drawer = document.querySelector("[data-drawer]");
  const scrim = document.querySelector("[data-scrim]");
  const burger = document.querySelector("[data-burger]");

  function setOpen(open) {
    if (drawer) {
      drawer.classList.toggle("open", open);
    }
    if (scrim) {
      scrim.classList.toggle("open", open);
    }
    if (burger) {
      burger.setAttribute("aria-expanded", String(open));
    }
  }

  if (burger) {
    burger.addEventListener("click", () => setOpen(true));
  }
  const closeBtn = document.querySelector("[data-close]");
  if (closeBtn) {
    closeBtn.addEventListener("click", () => setOpen(false));
  }
  if (scrim) {
    scrim.addEventListener("click", () => setOpen(false));
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") {
      setOpen(false);
    }
  });
}

// Update the cart/favorites numbers shown in the header.
function refreshHeaderCounts() {
  const cartCount = Store.countCartItems();
  const favCount = Store.loadFavorites().length;

  for (const badge of document.querySelectorAll("[data-cart-count]")) {
    badge.textContent = cartCount;
    badge.style.display = cartCount ? "" : "none";
  }
  for (const badge of document.querySelectorAll("[data-fav-count]")) {
    badge.textContent = favCount;
    badge.style.display = favCount ? "" : "none";
  }
}


/* =========================
   3. Product cards and page states
   ========================= */

// Product card used on home, products, favorites and related items.
// Pass { badge: "featured" } to mark the featured product on
// the home page with a visible "Featured" label.
function renderProductCard(product, options = {}) {
  const isFaved = Store.isFavorite(product.id);
  const onSale = product.compareAt && product.compareAt > product.price;

  let badges = "";
  if (options.badge === "featured") {
    badges += '<span class="badge featured">Featured</span>';
  }
  if (onSale) {
    const percent = Math.round((1 - product.price / product.compareAt) * 100);
    badges += '<span class="badge sale">Save ' + percent + "%</span>";
  }

  const favLabel = isFaved ? "Remove from favorites" : "Add to favorites";
  const favClass = isFaved ? "favorite-btn on" : "favorite-btn";

  return `
    <article class="product-card">
      <div class="product-image">
        <a href="product-details.html?id=${product.id}" aria-label="${Store.escapeHtml(product.title)}">
          ${productImageTag(product)}
        </a>
        <div class="product-badges">${badges}</div>
        <button class="${favClass}" data-fav="${product.id}" aria-label="${favLabel}" aria-pressed="${isFaved}">
          <img src="${heartIcon(isFaved)}" data-icon="fav" alt="">
        </button>
        <div class="quick-add">
          <button class="btn btn-solid btn-sm" data-add="${product.id}">Add to cart · ${Store.formatPrice(product.price)}</button>
          <a class="btn btn-line btn-sm btn-view" href="product-details.html?id=${product.id}" aria-label="View ${Store.escapeHtml(product.title)}">→</a>
        </div>
      </div>
      <div class="product-info">
        <div class="product-meta"><span>${Store.escapeHtml(product.category)}</span></div>
        <a class="product-name" href="product-details.html?id=${product.id}">${Store.escapeHtml(product.title)}</a>
        <div class="product-price"><span class="p">${Store.formatPrice(product.price)}</span>${
          onSale ? '<span class="old">' + Store.formatPrice(product.compareAt) + "</span>" : ""
        }</div>
        <div class="product-foot">
          <button class="add-link" data-add="${product.id}">+ Quick add</button>
          <a class="view-link" href="product-details.html?id=${product.id}">Details →</a>
        </div>
      </div>
    </article>`;
}

// Grey pulsing placeholders shown while products load.
function renderSkeletons(count = 8) {
  let html = "";
  for (let i = 0; i < count; i++) {
    html +=
      '<div><div class="skel-media"></div>' +
      '<div class="skel-line" style="width:60%"></div>' +
      '<div class="skel-line" style="width:90%"></div></div>';
  }
  return html;
}

// Friendly panel for empty carts, no search results, etc.
function renderEmptyState({ icon = "○", title = "Nothing here yet", body = "", actions = "" }) {
  return (
    '<div class="state"><div class="state-icon">' +
    icon +
    "</div><h3>" +
    title +
    "</h3><p>" +
    body +
    '</p><div class="row">' +
    actions +
    "</div></div>"
  );
}

// Friendly panel shown when the API cannot be reached.
function renderErrorState(message) {
  return (
    '<div class="state state-error"><div class="state-icon">⚠</div>' +
    "<h3>We couldn’t load products</h3><p>" +
    Store.escapeHtml(message || "The catalog service is unreachable. Check your connection and try again.") +
    '</p><div class="row"><button class="btn btn-solid btn-sm" data-retry>Retry</button>' +
    '<a class="btn btn-line btn-sm" href="index.html">Back home</a></div></div>'
  );
}


/* =========================
   4. Favorite and Add to Cart buttons
   ========================= */

// One delegated listener handles all [data-fav] and [data-add]
// buttons on every page, including buttons rendered later.
function bindShopButtons() {
  document.addEventListener("click", async (event) => {
    const favButton = event.target.closest("[data-fav]");
    if (favButton) {
      toggleFavoriteButton(favButton);
      return;
    }

    const addButton = event.target.closest("[data-add]");
    if (addButton) {
      await addProductToCart(addButton);
    }
  });
}

function toggleFavoriteButton(button) {
  const id = button.dataset.fav;
  const wasFavorite = Store.isFavorite(id);

  if (wasFavorite) {
    Store.removeFromFavorites(id);
  } else {
    Store.addToFavorites(id);
  }

  // Update every heart button for this product on the page.
  const nowFavorite = !wasFavorite;
  const allButtons = document.querySelectorAll('[data-fav="' + id + '"]');
  for (const btn of allButtons) {
    btn.classList.toggle("on", nowFavorite);
    btn.setAttribute("aria-pressed", String(nowFavorite));
    const icon = btn.querySelector("img");
    if (icon) {
      icon.src = heartIcon(nowFavorite);
    }
  }

  showToast(nowFavorite ? "Saved to favorites" : "Removed from favorites");
}

async function addProductToCart(button) {
  const id = button.dataset.add;

  // Find the product in the loaded catalog, or fetch it directly.
  let product = Api.getCachedProducts().find(
    (p) => String(p.id) === String(id)
  );
  if (!product) {
    try {
      product = await Api.getProduct(id);
    } catch (error) {
      showToast("Could not add — product unavailable");
      return;
    }
  }

  Store.addToCart(product, 1);
  flyToCart(button);
  showToast("Added — " + product.title.slice(0, 42), '<a href="cart.html">View cart</a>');
}

// Small dot that flies from the button to the cart icon.
function flyToCart(fromElement) {
  try {
    const cartIcon = document.querySelector('a[href="cart.html"].icon-btn');
    if (!fromElement || !cartIcon) {
      return;
    }
    const from = fromElement.getBoundingClientRect();
    const to = cartIcon.getBoundingClientRect();

    const dot = document.createElement("div");
    dot.style.cssText =
      "position:fixed;width:14px;height:14px;border-radius:50%;" +
      "background:var(--accent);z-index:300;pointer-events:none;" +
      "transition:transform .7s ease,opacity .7s;";
    dot.style.left = from.left + from.width / 2 + "px";
    dot.style.top = from.top + "px";
    document.body.appendChild(dot);

    requestAnimationFrame(() => {
      dot.style.transform =
        "translate(" + (to.left - from.left) + "px," + (to.top - from.top) + "px) scale(.3)";
      dot.style.opacity = "0";
    });

    setTimeout(() => dot.remove(), 750);
  } catch (error) {
    // Animation is decorative — the cart still updates.
  }
}


/* =========================
   5. Toast messages (small popups at the bottom)
   ========================= */

function showToast(message, link = "") {
  let box = document.getElementById("toasts");
  if (!box) {
    box = document.createElement("div");
    box.id = "toasts";
    document.body.appendChild(box);
  }

  const toast = document.createElement("div");
  toast.className = "toast";
  toast.setAttribute("role", "status");
  toast.innerHTML =
    '<span class="toast-icon">✓</span><span>' + message + "</span>" + link;
  box.appendChild(toast);

  setTimeout(() => toast.remove(), 3400);
}


/* =========================
   6. Home page sections
   Only runs on index.html (needs the #featured element).
   ========================= */

// Load the catalog, then fill every home section.
async function loadHomePage() {
  const featuredGrid = document.getElementById("featured");
  if (!featuredGrid) {
    return; // not on the home page
  }
  const arrivalsGrid = document.getElementById("arrivals");
  const categoryList = document.getElementById("catIndex");

  // Show loading placeholders while the API answers.
  featuredGrid.innerHTML = renderSkeletons(4);
  arrivalsGrid.innerHTML = renderSkeletons(4);

  try {
    const products = await Api.getProducts();
    renderHero(products);
    renderFeatured(products);
    renderArrivals(products);
    renderCategoryIndex(products);
    renderCuratedImage(products);
  } catch (error) {
    // The API failed: explain the problem and offer a retry.
    featuredGrid.innerHTML = renderErrorState(error.message);
    arrivalsGrid.innerHTML = "";
    categoryList.innerHTML = "<p class='muted'>Departments unavailable.</p>";

    const retryButton = featuredGrid.querySelector("[data-retry]");
    if (retryButton) {
      retryButton.addEventListener("click", loadHomePage);
    }
  }
}

// Pick the featured product with a deterministic rule based only
// on real API data: the first product of the cleaned catalog.
// The API provides no rating field, so nothing here is ranked
// by customer ratings.
function getFeaturedProduct(products) {
  const withPhotos = products.filter((p) => p.hasRealImages);
  return withPhotos[0] || products[0];
}

// Fill the hero collage with real product photos from the API.
// The "Object of the week" card shows the same featured product
// as the featured section below it.
function renderHero(products) {
  const withPhotos = products.filter((p) => p.hasRealImages);
  const mainProduct = withPhotos[3] || withPhotos[0];
  const sideProduct = getFeaturedProduct(products);

  const heroMain = document.getElementById("heroMain");
  if (heroMain && mainProduct) {
    setPhotoWithFallback(heroMain, mainProduct, 0);
    heroMain.alt = mainProduct.title;
    heroMain.closest("a").href = "product-details.html?id=" + mainProduct.id;
  }

  const heroSecond = document.getElementById("heroSecond");
  if (heroSecond && sideProduct) {
    setPhotoWithFallback(heroSecond, sideProduct, 0);
    heroSecond.alt = sideProduct.title;
  }

  const heroTag = document.getElementById("heroTag");
  if (heroTag && sideProduct) {
    heroTag.innerHTML =
      "<small>Object of the week</small><b>" +
      Store.escapeHtml(sideProduct.title.slice(0, 34)) +
      "</b><span>" +
      Store.escapeHtml(sideProduct.category) +
      " — " +
      Store.formatPrice(sideProduct.price) +
      '</span><a href="product-details.html?id=' +
      sideProduct.id +
      '">Shop this piece →</a>';
  }
}

// Assign a photo to an <img> created in HTML (hero, curated).
// Stores which product/photo it is, so a failure tries the next
// photo from product.images[] instead of breaking.
function setPhotoWithFallback(img, product, position = 0) {
  img.dataset.product = product.id;
  img.dataset.position = position;
  img.onerror = () => handleProductPhotoError(img);
  img.src = getSafeImageUrl(product, position);
}

// The featured section: the first 4 products of the cleaned
// catalog, in API order. The first card carries a "Featured"
// label so the featured product is clearly identifiable.
function renderFeatured(products) {
  const featured = products.slice(0, 4);

  document.getElementById("featured").innerHTML = featured
    .map((product, index) =>
      renderProductCard(product, { badge: index === 0 ? "featured" : "" })
    )
    .join("");
}

// The 4 newest products (highest id first).
function renderArrivals(products) {
  const arrivals = [...products].sort((a, b) => b.id - a.id).slice(0, 4);

  document.getElementById("arrivals").innerHTML = arrivals
    .map((product) => renderProductCard(product))
    .join("");
}

// One ruled row per department, with photo and product count.
function renderCategoryIndex(products) {
  const byCategory = {};
  for (const product of products) {
    if (!byCategory[product.category]) {
      byCategory[product.category] = [];
    }
    byCategory[product.category].push(product);
  }

  const rows = Object.entries(byCategory).slice(0, 5);
  const categoryList = document.getElementById("catIndex");

  categoryList.innerHTML = rows
    .map(([name, list], index) => {
      const cheapest = Math.min(...list.map((p) => p.price));
      const thumb = getSafeImageUrl(list[0]);
      return (
        '<div class="category-row" data-cat="' +
        Store.escapeHtml(name) +
        '" role="link" tabindex="0" aria-label="Shop ' +
        Store.escapeHtml(name) +
        '">' +
        '<span class="category-num">0' +
        (index + 1) +
        "</span>" +
        '<span class="category-name">' +
        Store.escapeHtml(name) +
        "<small>" +
        Store.escapeHtml(list[0].title.slice(0, 52)) +
        " · from " +
        Store.formatPrice(cheapest) +
        "</small></span>" +
        '<span class="category-count">' +
        list.length +
        " pieces</span>" +
        '<img class="category-thumb" src="' +
        Store.escapeHtml(thumb) +
        '" alt="" loading="lazy" referrerpolicy="no-referrer" ' +
        'data-product="' +
        list[0].id +
        '" data-position="0" ' +
        'onerror="handleProductPhotoError(this)">' +
        '<span class="category-go">→</span></div>'
      );
    })
    .join("");

  // Clicking (or pressing Enter on) a row opens that department.
  for (const row of categoryList.querySelectorAll(".category-row")) {
    const open = () => {
      location.href = "products.html?cat=" + encodeURIComponent(row.dataset.cat);
    };
    row.addEventListener("click", open);
    row.addEventListener("keydown", (event) => {
      if (event.key === "Enter" || event.key === " ") {
        event.preventDefault();
        open();
      }
    });
  }
}

// Photo for the dark curated-collection panel.
function renderCuratedImage(products) {
  const withPhotos = products.filter((p) => p.hasRealImages);
  const product = withPhotos[10] || withPhotos[2];
  const img = document.getElementById("curatedImg");

  if (product && img) {
    setPhotoWithFallback(img, product, 0);
    img.alt = product.title;
  }
}


/* =========================
   Page start: runs on every page
   ========================= */

// Which nav link counts as active, based on the file name.
// Products and product details share the "products" link.
function detectActivePage() {
  const file = (location.pathname.split("/").pop() || "index.html").split("?")[0];
  if (file === "" || file === "index.html") {
    return "home";
  }
  if (file === "products.html" || file === "product-details.html") {
    return "products";
  }
  if (file === "favorites.html") {
    return "favorites";
  }
  if (file === "cart.html") {
    return "cart";
  }
  if (file === "checkout.html") {
    return "checkout";
  }
  return "";
}

document.addEventListener("DOMContentLoaded", () => {
  Theme.init();
  // The header and footer are mounted here, exactly once per
  // page — including index.html, which has no page script.
  mountPage(detectActivePage());
  bindShopButtons();
  loadHomePage(); // does nothing unless #featured exists
  // Keep icon files in sync when the theme is switched.
  document.addEventListener("vibe:theme", refreshThemeIcons);
});
