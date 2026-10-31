

// Base address of the Platzi Fake Store API.
const API_BASE_URL = "https://api.escuelajs.co/api/v1";


const PLACEHOLDER_IMAGE =
  "data:image/svg+xml;utf8," +
  encodeURIComponent(
    '<svg xmlns="http://www.w3.org/2000/svg" width="800" height="1000">' +
      '<rect width="100%" height="100%" fill="#E7DFCE"/>' +
      '<rect x="310" y="400" width="180" height="150" rx="8" fill="none" stroke="#9A9081" stroke-width="3"/>' +
      '<path d="M350 400v-25a50 50 0 0 1 100 0v25" fill="none" stroke="#9A9081" stroke-width="3"/>' +
      '<text x="400" y="610" text-anchor="middle" font-family="sans-serif" font-size="30" fill="#6F6659">VibeShopping</text>' +
      '<text x="400" y="645" text-anchor="middle" font-family="sans-serif" font-size="18" fill="#9A9081">Photo coming soon</text>' +
      "</svg>"
  );


const JUNK_IMAGE_HOSTS = [
  "placeimg.com",
  "image-1.co",
  "placehold.co",
  "placehold.it",
  "via.placeholder.com",
  "dummyimage.com",
];

function isJunkImageUrl(url) {
  if (typeof url !== "string" || url.startsWith("data:")) {
    return false;
  }
  return JUNK_IMAGE_HOSTS.some((host) => url.includes(host));
}

function safeImageUrl(url) {
  if (typeof url === "string") {
    const trimmed = url.trim();
    const isHttp =
      trimmed.startsWith("http://") || trimmed.startsWith("https://");
    if (isHttp && !isJunkImageUrl(trimmed)) {
      return trimmed;
    }
    if (trimmed.startsWith("data:")) {
      return trimmed;
    }
  }
  return PLACEHOLDER_IMAGE;
}

const failedImageUrls = loadFailedImageUrls();

function loadFailedImageUrls() {
  try {
    const saved = sessionStorage.getItem("vibeshopping_failed_images");
    return new Set(saved ? JSON.parse(saved) : []);
  } catch (error) {
    return new Set();
  }
}


function rememberFailedImage(url) {
  if (!url || url.startsWith("data:")) {
    return;
  }
  failedImageUrls.add(url);
  try {
    sessionStorage.setItem(
      "vibeshopping_failed_images",
      JSON.stringify(Array.from(failedImageUrls))
    );
  } catch (error) {

  }
}

function didImageFail(url) {
  return failedImageUrls.has(url);
}


function handleProductPhotoError(img) {
 
  img.onerror = null;

  const failedUrl = img.src;
  rememberFailedImage(failedUrl);

  const productId = img.dataset.product;
  const position = Number(img.dataset.position || 0);

  if (productId) {
    const product = getCachedProducts().find(
      (p) => String(p.id) === String(productId)
    );

    if (product) {
      for (let i = position + 1; i < product.images.length; i++) {
        const next = product.images[i];
        if (next !== failedUrl && !didImageFail(next)) {
          // Try the next photo; re-arm the handler for it.
          img.dataset.position = i;
          img.onerror = () => handleProductPhotoError(img);
          img.src = next;
          return;
        }
      }
    }
  }

  // No usable photo left — show the built-in placeholder.
  img.src = PLACEHOLDER_IMAGE;
}


function cleanImageList(rawImages) {
  let list = [];

  if (Array.isArray(rawImages)) {
    list = rawImages;
  } else if (typeof rawImages === "string") {
    
    try {
      const parsed = JSON.parse(rawImages);
      list = Array.isArray(parsed) ? parsed : [rawImages];
    } catch (error) {
      list = [rawImages];
    }
  }

  const clean = [];

  for (const entry of list) {
    if (typeof entry !== "string") {
      continue;
    }

    
    let url = entry.trim().replace(/^["'\[]+|["'\]]+$/g, "").trim();

    
    if (url.startsWith('["')) {
      try {
        const parsed = JSON.parse(url);
        if (Array.isArray(parsed)) {
          for (const inner of parsed) {
            if (typeof inner === "string" && inner.trim()) {
              clean.push(inner.trim());
            }
          }
          continue;
        }
      } catch (error) {
       
      }
    }

    if (url) {
      clean.push(url);
    }
  }

  // Keep only real http(s) URLs, skip junk hosts and duplicates.
  const seen = new Set();
  const result = [];

  for (const url of clean) {
    const isHttp = url.startsWith("http://") || url.startsWith("https://");

    if (isHttp && !isJunkImageUrl(url) && !seen.has(url)) {
      seen.add(url);
      result.push(url);
    }
  }

  return result;
}

// Read the category name, whatever shape the API used.
function readCategoryName(product) {
  if (product.category && typeof product.category === "object") {
    return product.category.name || "General";
  }
  if (typeof product.category === "string") {
    return product.category;
  }
  return "General";
}


function isTestJunkTitle(title) {
  return /^title-[0-9a-f-]{8,}$/i.test((title || "").trim());
}


function isGeneratedTestTitle(title) {
  return /^(updated\s+)?new product\s*\d*\s*$/i.test((title || "").trim());
}


function normalizeProduct(product, index = 0) {
  const images = cleanImageList(product.images);
  const price = Number(product.price) || 0;

  
  const rawTitle = (product.title || "").trim();
  const title = rawTitle || "Unnamed product";

  return {
    id: product.id,
    title: title,
    price: price,
    
    compareAt: price > 60 ? Math.round(price * 1.25) : null,
    description: (
      product.description ||
      "A considered everyday essential, selected by the VibeShopping buying team for material, make and longevity."
    ).trim(),
    category: readCategoryName(product),
    
    images: images.length > 0 ? images : [PLACEHOLDER_IMAGE],
    hasRealImages: images.length > 0,
    stock: 4 + ((Number(product.id) || index) * 13) % 30,
  };
}
async function fetchJson(url) {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 15000);

  try {
    const response = await fetch(url, { signal: controller.signal });
    if (!response.ok) {
      throw new Error("Request failed with status " + response.status);
    }
    return await response.json();
  } finally {
    clearTimeout(timeoutId);
  }
}


let productCache = null;
let productCacheTime = 0;
let categoryCache = null;
const CACHE_LIFETIME = 5 * 60 * 1000; // 5 minutes

// Get all products (uses the cache when it is still fresh).
async function getProducts(forceRefresh = false) {
  const cacheIsFresh =
    productCache && Date.now() - productCacheTime < CACHE_LIFETIME;

  if (cacheIsFresh && !forceRefresh) {
    return productCache;
  }

  const data = await fetchJson(API_BASE_URL + "/products?offset=0&limit=45");
  const products = (Array.isArray(data) ? data : [])
    .map((item, index) => normalizeProduct(item, index))
    .filter(
      (product) =>
        product.hasRealImages &&
        !isTestJunkTitle(product.title) &&
        !isGeneratedTestTitle(product.title)
    );

  if (products.length === 0) {
    throw new Error("The catalog came back empty.");
  }

  productCache = products;
  productCacheTime = Date.now();
  categoryCache = [...new Set(products.map((p) => p.category))].sort();

  return products;
}

// Products already loaded (empty array when nothing loaded yet).
function getCachedProducts() {
  return productCache || [];
}

// Get one product: prefer the cache, fetch from the API otherwise.
async function getProduct(id) {
  const cached = getCachedProducts().find(
    (product) => String(product.id) === String(id)
  );
  if (cached) {
    return cached;
  }
  const data = await fetchJson(API_BASE_URL + "/products/" + id);
  return normalizeProduct(data);
}
// Get the category names for the filter pills.
async function getCategories() {
  if (categoryCache) {
    return categoryCache;
  }
  try {
    const data = await fetchJson(API_BASE_URL + "/categories?offset=0&limit=20");
    const names = (Array.isArray(data) ? data : [])
      .map((category) => category.name)
      .filter(Boolean);
    if (names.length > 0) {
      categoryCache = names.slice(0, 8);
      return categoryCache;
    }
  } catch (error) {
    // Fall through to deriving categories from the products.
  }
  const products = await getProducts();
  categoryCache = [...new Set(products.map((p) => p.category))].sort();
  return categoryCache;
}

// Shared API object used by every page.
const Api = {
  getProducts,
  getProduct,
  getCategories,
  getCachedProducts,
};
window.Api = Api;
