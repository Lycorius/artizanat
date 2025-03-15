function addToCart(product) {
  let cart = JSON.parse(localStorage.getItem("cart") || "[]");

  const existingProduct = cart.find((item) => item.id === product.id);

  if (existingProduct) {
    existingProduct.quantity = (existingProduct.quantity || 1) + 1;
  } else {
    cart.push({
      id: product.id,
      nume: product.nume,
      pret: product.pret,
      imagine: product.imagine,
      categorie: product.categorie,
      quantity: 1,
    });
  }

  localStorage.setItem("cart", JSON.stringify(cart));
  updateCartUI(product.id);
}

function fetchAndRenderProducts(category = "Platouri") {
  fetch("/JSON/items.json")
    .then((response) => response.json())
    .then((data) => {
      const container = document.getElementById("product-container");
      if (!container) return;

      container.innerHTML = "";

      const products = data.produse[category];
      if (!products) return;

      products.forEach((product, index) => {
        if (!product.imagine) return;

        const productDiv = document.createElement("div");
        productDiv.classList.add("product");

        const productId = product.id || index + 1;

        productDiv.innerHTML = `
                    <img class="product-img" src="${product.imagine}" alt="${
          product.nume || "Product"
        }">
                    <div class="products-content">
                        <p>${product.nume || "Product Name"}</p>
                        <div class="price-cart">
                            <span class="price">${
                              product.pret || "0 MDL"
                            }</span>
                            <span class="cart-icon" data-product-id="${productId}">
                                <img src="/imagine/COȘ.svg" alt="Cart">
                            </span>
                        </div>
                    </div>
                `;

        container.appendChild(productDiv);

        const cartIcon = productDiv.querySelector(".cart-icon");
        cartIcon.addEventListener("click", (e) => {
          e.preventDefault();
          addToCart({
            id: productId,
            nume: product.nume || "Product Name",
            pret: product.pret || "0 MDL",
            imagine: product.imagine,
            categorie: category,
          });
        });

        const cart = JSON.parse(localStorage.getItem("cart") || "[]");
        if (cart.some((item) => item.id === productId)) {
          cartIcon.classList.add("active");
        }
      });
    })
    .catch((error) => {
      console.error("Error loading products:", error);
      const container = document.getElementById("product-container");
      if (container) {
        container.innerHTML =
          '<p class="error">Error loading products. Please try again later.</p>';
      }
    });
}
const button = document.getElementById("trimite-button");
const notificare = document.getElementById("notificare");

button.addEventListener("click", () => {
  notificare.classList.add("show");

  setTimeout(() => {
    notificare.classList.remove("show");
  }, 3000);
});

document.addEventListener("DOMContentLoaded", function () {
  fetchAndRenderProducts("Platouri");

  const items = document.querySelectorAll(".item");

  items.forEach((item) => {
    item.addEventListener("click", function () {
      items.forEach((i) => i.classList.remove("active"));
      item.classList.add("active");

      const category = item.getAttribute("data-category");
      if (category) {
        fetchAndRenderProducts(category);
      }
    });
  });

  const platouriCircle = document.querySelector(
    '.item[data-category="Platouri"]'
  );
  if (platouriCircle) {
    platouriCircle.classList.add("active");
  }
});
