
document.addEventListener("DOMContentLoaded", () => {
  // Products list page needs the #grid element.
  if (document.getElementById("grid")) {
    loadProductsPage();
  }

  if (document.getElementById("pd")) {
    loadProductDetails();
  }
});

// Current discovery state (search text, active category…).
const filters = {
  allProducts: [],
  categories: [],
  searchText: "",
  category: "All",
  sort: "featured",
  maxPrice: Infinity,
  priceCap: 1000,
  // Pagination state: 8 products per page (2 full rows of the 4-column grid).
  currentPage: 1,
  productsPerPage: 8,
};

async function loadProductsPage() {
  const grid = document.getElementById("grid");

  // Read the filters from the URL (?cat=Shoes&sort=price-asc).
  const params = new URLSearchParams(location.search);
  filters.searchText = params.get("q") || "";
  filters.category = params.get("cat") || "All";
  filters.sort = params.get("sort") || "featured";

  document.getElementById("q").value = filters.searchText;
  document.getElementById("sort").value = filters.sort;

  bindFilterInputs();
  grid.innerHTML = renderSkeletons(8);

  try {
    const products = await Api.getProducts();
    const categories = await Api.getCategories().catch(() => []);
    setupFilters(products, categories);
    renderProducts();
  } catch (error) {
    // The API failed: explain the problem and offer a retry.
    grid.innerHTML = renderErrorState(error.message);
    document.getElementById("meta").innerHTML = "";

    const retryButton = grid.querySelector("[data-retry]");
    if (retryButton) {
      retryButton.addEventListener("click", loadProductsPage);
    }
  }
}

// Prepare categories and the price slider, then draw the pills.
function setupFilters(products, categories) {
  filters.allProducts = products;
  filters.currentPage = 1;

  const names = new Set([...categories, ...products.map((p) => p.category)]);
  filters.categories = ["All", ...names].slice(0, 9);

  if (!filters.categories.includes(filters.category)) {
    filters.category = "All";
  }

  // The slider goes from $10 up to the most expensive product.
  const highest = Math.max(...products.map((p) => p.price));
  filters.priceCap = Math.max(50, Math.ceil(highest / 50) * 50);
  filters.maxPrice = filters.priceCap;

  const slider = document.getElementById("maxPrice");
  slider.max = filters.priceCap;
  slider.value = filters.priceCap;
  document.getElementById("priceOut").textContent =
    "Up to " + Store.formatPrice(filters.priceCap);

  renderCategoryPills();
}

// Listen to the search box, sort dropdown and price slider.
function bindFilterInputs() {
  const searchInput = document.getElementById("q");
  const sortSelect = document.getElementById("sort");
  const slider = document.getElementById("maxPrice");

  // Wait 220ms after typing so we don't re-render on every keystroke.
  let searchTimer;
  searchInput.addEventListener("input", () => {
    clearTimeout(searchTimer);
    searchTimer = setTimeout(() => {
      filters.searchText = searchInput.value.trim();
      filters.currentPage = 1;
      renderProducts();
      saveFiltersToUrl();
    }, 220);
  });

  sortSelect.addEventListener("change", () => {
    filters.sort = sortSelect.value;
    filters.currentPage = 1;
    renderProducts();
    saveFiltersToUrl();
  });

  slider.addEventListener("input", () => {
    filters.maxPrice = Number(slider.value);
    document.getElementById("priceOut").textContent =
      "Up to " + Store.formatPrice(filters.maxPrice);
    filters.currentPage = 1;
    renderProducts();
  });
  slider.addEventListener("change", saveFiltersToUrl);
}

// Keep the URL in sync so filtered views can be shared/bookmarked.
function saveFiltersToUrl() {
  const params = new URLSearchParams();
  if (filters.searchText) {
    params.set("q", filters.searchText);
  }
  if (filters.category !== "All") {
    params.set("cat", filters.category);
  }
  if (filters.sort !== "featured") {
    params.set("sort", filters.sort);
  }
  const query = params.toString();
  history.replaceState(null, "", location.pathname + (query ? "?" + query : ""));
}

// Draw the category pills and handle clicks.
function renderCategoryPills() {
  const box = document.getElementById("chips");

  box.innerHTML = filters.categories
    .map((name) => {
      const active = filters.category === name ? " on" : "";
      return (
        '<button class="chip' +
        active +
        '" data-cat="' +
        Store.escapeHtml(name) +
        '">' +
        Store.escapeHtml(name) +
        "</button>"
      );
    })
    .join("");

  for (const pill of box.querySelectorAll("[data-cat]")) {
    pill.addEventListener("click", () => {
      filters.category = pill.dataset.cat;
      filters.currentPage = 1;
      renderCategoryPills();
      renderProducts();
      saveFiltersToUrl();
    });
  }
}

// Apply search + category + price + sorting, in that order.
function getFilteredProducts() {
  let list = [...filters.allProducts];

  // 1. Category filter.
  if (filters.category !== "All") {
    list = list.filter((p) => p.category === filters.category);
  }

  // 2. Search filter (matches title, description and category).
  if (filters.searchText) {
    const query = filters.searchText.toLowerCase();
    list = list.filter((p) =>
      (p.title + " " + p.description + " " + p.category)
        .toLowerCase()
        .includes(query)
    );
  }

  // 3. Max-price filter.
  list = list.filter((p) => p.price <= filters.maxPrice);

  // 4. Sorting ("featured" keeps the catalog's API order).
  if (filters.sort === "price-asc") {
    list.sort((a, b) => a.price - b.price);
  } else if (filters.sort === "price-desc") {
    list.sort((a, b) => b.price - a.price);
  } else if (filters.sort === "name-asc") {
    list.sort((a, b) => a.title.localeCompare(b.title));
  } else if (filters.sort === "name-desc") {
    list.sort((a, b) => b.title.localeCompare(a.title));
  }

  return list;
}

// Draw the product count and the matching product cards (one page at a time).
function renderProducts() {
  const grid = document.getElementById("grid");
  const meta = document.getElementById("meta");
  const list = getFilteredProducts();

  const filtersActive =
    filters.searchText ||
    filters.category !== "All" ||
    filters.maxPrice < filters.priceCap;

  meta.innerHTML =
    "<span><b>" +
    list.length +
    "</b> of " +
    filters.allProducts.length +
    " products</span>" +
    (filtersActive
      ? '<button class="link-remove" id="clearFilters">Clear all filters</button>'
      : "");

  const clearButton = document.getElementById("clearFilters");
  if (clearButton) {
    clearButton.addEventListener("click", resetFilters);
  }

  // Nothing matched: show a helpful empty state.
  if (list.length === 0) {
    grid.innerHTML = renderEmptyState({
      icon: "⌕",
      title: "No products found",
      body: "Try a different search term, widen the price range, or browse the full collection.",
      actions: '<button class="btn btn-solid btn-sm" id="showAll">View everything</button>',
    });

    document
      .getElementById("showAll")
      .addEventListener("click", resetFilters);
    renderPagination(0, 1);
    return;
  }

  // Paginate AFTER filtering/sorting: show only this page's slice.
  const totalPages = Math.max(1, Math.ceil(list.length / filters.productsPerPage));
  if (filters.currentPage > totalPages) {
    filters.currentPage = totalPages;
  }
  if (filters.currentPage < 1) {
    filters.currentPage = 1;
  }
  const startIndex = (filters.currentPage - 1) * filters.productsPerPage;
  const endIndex = startIndex + filters.productsPerPage;
  const pageItems = list.slice(startIndex, endIndex);

  grid.innerHTML = pageItems.map((p) => renderProductCard(p)).join("");
  renderPagination(list.length, totalPages);
}

// Previous / Next controls below the grid (no page numbers).
function renderPagination(totalItems, totalPages) {
  const box = document.getElementById("pagination");
  if (!box) {
    return;
  }
  if (totalItems === 0) {
    box.innerHTML = "";
    return;
  }

  const prevDisabled = filters.currentPage <= 1 ? " disabled" : "";
  const nextDisabled = filters.currentPage >= totalPages ? " disabled" : "";

  box.innerHTML =
    '<button class="page-btn" id="prevPage" aria-label="Previous page"' +
    prevDisabled +
    '><span aria-hidden="true">←</span><span class="lbl">Previous</span></button>' +
    '<span class="muted" style="font-size:13px;font-weight:600;min-width:92px;text-align:center">Page ' +
    filters.currentPage +
    " of " +
    totalPages +
    "</span>" +
    '<button class="page-btn" id="nextPage" aria-label="Next page"' +
    nextDisabled +
    '><span class="lbl">Next</span><span aria-hidden="true">→</span></button>';

  document.getElementById("prevPage").addEventListener("click", () => {
    if (filters.currentPage > 1) {
      filters.currentPage -= 1;
      renderProducts();
      scrollGridIntoView();
    }
  });
  document.getElementById("nextPage").addEventListener("click", () => {
    if (filters.currentPage < totalPages) {
      filters.currentPage += 1;
      renderProducts();
      scrollGridIntoView();
    }
  });
}

// Keep the product grid roughly in view after changing pages.
function scrollGridIntoView() {
  const grid = document.getElementById("grid");
  if (grid && typeof grid.scrollIntoView === "function") {
    grid.scrollIntoView({ behavior: "smooth", block: "start" });
  }
}

// Reset every filter back to the full catalog.
function resetFilters() {
  filters.searchText = "";
  filters.category = "All";
  filters.maxPrice = filters.priceCap;
  filters.currentPage = 1;

  document.getElementById("q").value = "";
  const slider = document.getElementById("maxPrice");
  slider.value = filters.priceCap;
  document.getElementById("priceOut").textContent =
    "Up to " + Store.formatPrice(filters.priceCap);

  renderCategoryPills();
  renderProducts();
  saveFiltersToUrl();
}


/* ============================================================
   Product details page (needs the #pd element).
   The photo gallery is built from product.images: one photo
   per entry. A single photo shows a single-photo gallery.
   ============================================================ */

async function loadProductDetails() {
  const box = document.getElementById("pd");
  const id = new URLSearchParams(location.search).get("id");

  // No product chosen: point the visitor to the catalog.
  if (!id) {
    box.innerHTML = renderEmptyState({
      icon: "◇",
      title: "No product selected",
      body: "Choose something from the catalog to see it here.",
      actions:
        '<a class="btn btn-solid btn-sm" href="products.html">Browse products</a>',
    });
    return;
  }

  // Loading placeholders while the API answers.
  box.innerHTML =
    '<div class="details-grid"><div><div class="skel-media"></div></div>' +
    '<div><div class="skel-line" style="width:40%"></div>' +
    '<div class="skel-line" style="width:90%"></div></div></div>';

  let product;
  try {
    product = await Api.getProduct(id);
  } catch (error) {
    box.innerHTML = renderErrorState(
      "This product could not be loaded. It may have been removed."
    );
    const retryButton = box.querySelector("[data-retry]");
    if (retryButton) {
      retryButton.addEventListener("click", () => location.reload());
    }
    return;
  }

  renderProductDetails(product);
  renderRelatedProducts(product);
}

function renderProductDetails(product) {
  const box = document.getElementById("pd");
  const isFaved = Store.isFavorite(product.id);
  const onSale = product.compareAt && product.compareAt > product.price;

  // The gallery photos: exactly the images[] array, minus any
  // photo that already failed earlier in this visit.
  const galleryImages = product.images.filter((url) => !didImageFail(url));
  if (galleryImages.length === 0) {
    galleryImages.push(PLACEHOLDER_IMAGE);
  }

  document.title = product.title + " — VibeShopping";

  // Previous/next buttons and thumbnails only make sense
  // when there is more than one photo.
  const hasSeveralPhotos = galleryImages.length > 1;

  let thumbnails = "";
  if (hasSeveralPhotos) {
    thumbnails =
      '<div class="gallery-thumbs">' +
      galleryImages
        .map((url, i) => {
          const active = i === 0 ? " on" : "";
          return (
            '<button data-thumb="' +
            i +
            '" class="' +
            active.trim() +
            '" aria-label="View image ' +
            (i + 1) +
            '"><img src="' +
            Store.escapeHtml(url) +
            '" alt="" loading="lazy" referrerpolicy="no-referrer" ' +
            'data-product="' +
            product.id +
            '" data-position="' +
            product.images.indexOf(url) +
            '" ' +
            'onerror="handleProductPhotoError(this)"></button>'
          );
        })
        .join("") +
      "</div>";
  } else {
    thumbnails =
      '<p class="muted" style="font-size:12.5px;margin-top:10px">' +
      "Single studio image available for this piece.</p>";
  }

  let navButtons = '<span class="gallery-count">1 / 1</span>';
  if (hasSeveralPhotos) {
    navButtons =
      '<button class="gallery-btn prev" id="prevPhoto" aria-label="Previous image">←</button>' +
      '<button class="gallery-btn next" id="nextPhoto" aria-label="Next image">→</button>' +
      '<span class="gallery-count" id="photoCount">1 / ' +
      galleryImages.length +
      "</span>";
  }

  let saleTag = "";
  if (onSale) {
    const percent = Math.round((1 - product.price / product.compareAt) * 100);
    saleTag =
      '<span class="was">' +
      Store.formatPrice(product.compareAt) +
      '</span><span class="save">SAVE ' +
      percent +
      "%</span>";
  }

  box.innerHTML = `
    <nav class="crumbs"><a href="index.html">Home</a> / <a href="products.html">Products</a> / <span>${Store.escapeHtml(product.title.slice(0, 40))}</span></nav>
    <div class="details-grid">
      <div class="gallery" aria-label="Product gallery">
        <div class="gallery-main">
          <img id="mainPhoto" src="${Store.escapeHtml(galleryImages[0])}" alt="${Store.escapeHtml(product.title)}" referrerpolicy="no-referrer" data-product="${product.id}" data-position="${product.images.indexOf(galleryImages[0])}" onerror="handleProductPhotoError(this)">
          ${navButtons}
        </div>
        ${thumbnails}
      </div>
      <div class="details-info">
        <div class="details-eyebrow"><span>${Store.escapeHtml(product.category)}</span><span>·</span><span>SKU VS-${String(product.id).padStart(4, "0")}</span></div>
        <h1>${Store.escapeHtml(product.title)}</h1>
        <div class="details-price"><span class="now">${Store.formatPrice(product.price)}</span>${saleTag}</div>
        <p class="details-desc">${Store.escapeHtml(product.description)}</p>
        <div class="stock"><i></i>${product.stock < 8 ? "Only " + product.stock + " left in stock — order soon" : "In stock — ships within 24 hours"}</div>
        <div class="buy-row">
          <div class="quantity" role="group" aria-label="Quantity"><button id="lessQty" aria-label="Decrease quantity">−</button><b id="qtyValue">1</b><button id="moreQty" aria-label="Increase quantity">+</button></div>
          <div class="buy-actions">
            <button class="btn btn-solid" id="addButton">Add to cart · <span id="addTotal">${Store.formatPrice(product.price)}</span></button>
            <button class="favorite-btn ${isFaved ? "on" : ""}" style="position:static;width:52px;height:52px;border-radius:6px" data-fav="${product.id}" aria-label="Toggle favorite"><img src="${heartIcon(isFaved)}" data-icon="fav" alt=""></button>
          </div>
        </div>
        <button class="btn btn-line btn-block" id="buyNow">Buy it now</button>
        <div class="accordion">
          <details open><summary>Details &amp; materials</summary><p>${Store.escapeHtml(product.description)} Made to be worn, used and kept. Spot clean and store folded.</p></details>
          <details><summary>Shipping &amp; returns</summary><p>Free carbon-neutral shipping on orders over $75. 30-day returns, no questions asked.</p></details>
          <details><summary>About these photos</summary><p>Photography comes from the Platzi Fake Store API (${galleryImages.length} photo${galleryImages.length > 1 ? "s" : ""} on file for this product).</p></details>
        </div>
        <div class="details-meta"><span>Category — <b>${Store.escapeHtml(product.category)}</b></span><span>Availability — <b>In stock, ships in 24h</b></span></div>
      </div>
    </div>`;

  bindGallery(galleryImages, product.images, product.title);
  bindBuyBox(product);
}

// Switch the large photo when a thumbnail or arrow is used.
// images[] holds the gallery photos; fullList is product.images
// so the error handler can offer the next photo on failure.
function bindGallery(images, fullList, title) {
  const mainPhoto = document.getElementById("mainPhoto");
  const count = document.getElementById("photoCount");
  const thumbs = [...document.querySelectorAll("[data-thumb]")];
  let current = 0;

  function showPhoto(index) {
    current = (index + images.length) % images.length;
    // Re-arm the fallback chain for the newly shown photo.
    mainPhoto.onerror = () => handleProductPhotoError(mainPhoto);
    mainPhoto.dataset.position = fullList.indexOf(images[current]);
    mainPhoto.src = images[current];
    mainPhoto.alt = title + " — image " + (current + 1);

    if (count) {
      count.textContent = current + 1 + " / " + images.length;
    }
    thumbs.forEach((thumb, i) => {
      thumb.classList.toggle("on", i === current);
    });
  }

  const prev = document.getElementById("prevPhoto");
  if (prev) {
    prev.addEventListener("click", () => showPhoto(current - 1));
  }
  const next = document.getElementById("nextPhoto");
  if (next) {
    next.addEventListener("click", () => showPhoto(current + 1));
  }
  for (const thumb of thumbs) {
    thumb.addEventListener("click", () => showPhoto(Number(thumb.dataset.thumb)));
  }

  // Arrow keys switch photos; swiping works on touch screens.
  document.addEventListener("keydown", (event) => {
    if (!document.getElementById("mainPhoto")) {
      return;
    }
    if (event.key === "ArrowLeft") {
      showPhoto(current - 1);
    }
    if (event.key === "ArrowRight") {
      showPhoto(current + 1);
    }
  });

  let touchStart = null;
  const frame = document.querySelector(".gallery-main");
  frame.addEventListener("touchstart", (e) => (touchStart = e.touches[0].clientX), {
    passive: true,
  });
  frame.addEventListener(
    "touchend",
    (e) => {
      if (touchStart === null) {
        return;
      }
      const moved = e.changedTouches[0].clientX - touchStart;
      if (Math.abs(moved) > 40) {
        showPhoto(current + (moved < 0 ? 1 : -1));
      }
      touchStart = null;
    },
    { passive: true }
  );
}

// Quantity stepper plus Add to Cart / Buy Now buttons.
function bindBuyBox(product) {
  let quantity = 1;
  const qtyValue = document.getElementById("qtyValue");
  const addTotal = document.getElementById("addTotal");

  function refreshTotal() {
    qtyValue.textContent = quantity;
    addTotal.textContent = Store.formatPrice(product.price * quantity);
  }

  document.getElementById("lessQty").addEventListener("click", () => {
    quantity = Math.max(1, quantity - 1);
    refreshTotal();
  });
  document.getElementById("moreQty").addEventListener("click", () => {
    quantity = Math.min(9, quantity + 1);
    refreshTotal();
  });

  document.getElementById("addButton").addEventListener("click", (event) => {
    Store.addToCart(product, quantity);
    showToast("Added " + quantity + " × " + product.title.slice(0, 40));
  });

  document.getElementById("buyNow").addEventListener("click", () => {
    Store.addToCart(product, quantity);
    location.href = "checkout.html";
  });
}

// Products from the same department (or others when too few).
async function renderRelatedProducts(product) {
  const box = document.getElementById("related");
  try {
    const cached = Api.getCachedProducts();
    const all = cached.length > 0 ? cached : await Api.getProducts();

    let related = all
      .filter((p) => String(p.id) !== String(product.id) && p.category === product.category)
      .slice(0, 4);

    if (related.length === 0) {
      related = all.filter((p) => String(p.id) !== String(product.id)).slice(0, 4);
    }
    box.innerHTML = related.map((p) => renderProductCard(p)).join("");
  } catch (error) {
    box.innerHTML = "";
  }
}
