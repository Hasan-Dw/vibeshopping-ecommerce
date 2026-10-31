

document.addEventListener("DOMContentLoaded", () => {
  // The header is already mounted by main.js boot.
  renderFavorites();

  // Re-render when a heart button is toggled anywhere.
  document.addEventListener("vibe:favorites", renderFavorites);
});

async function renderFavorites() {
  const box = document.getElementById("favBox");
  const ids = Store.loadFavorites();

  // Empty wishlist: invite the visitor to discover products.
  if (ids.length === 0) {
    box.innerHTML = renderEmptyState({
      icon: "♥",
      title: "Your wishlist is empty",
      body: "Tap the heart on any product to keep it here for later. Your favorites are saved on this device.",
      actions:
        '<a class="btn btn-solid btn-sm" href="products.html">Discover products</a>',
    });
    return;
  }

  box.innerHTML =
    '<div class="product-grid">' + renderSkeletons(ids.length) + "</div>";

  try {
    // Match saved ids with loaded products.
    const cached = Api.getCachedProducts();
    const all = cached.length > 0 ? cached : await Api.getProducts();

    const items = [];
    for (const id of ids) {
      const found = all.find((p) => String(p.id) === String(id));
      if (found) {
        items.push(found);
      }
    }

    if (items.length === 0) {
      throw new Error("Saved items are unavailable.");
    }

    box.innerHTML =
      "<p class='muted' style='margin-bottom:18px'>" +
      items.length +
      " saved piece" +
      (items.length > 1 ? "s" : "") +
      "</p>" +
      '<div class="product-grid">' +
      items.map((p) => renderProductCard(p)).join("") +
      "</div>";
  } catch (error) {
    box.innerHTML = renderErrorState(
      "Saved items could not be loaded right now."
    );
    const retryButton = box.querySelector("[data-retry]");
    if (retryButton) {
      retryButton.addEventListener("click", renderFavorites);
    }
  }
}
