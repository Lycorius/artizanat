function getCurrentCounterValue() {
  return Number(document.getElementById("counter-display").value);
}

function setCounterValue(newValue) {
  document.getElementById("counter-display").value = newValue;
}

function incrementCounter() {
  var currentValue = getCurrentCounterValue();
  setCounterValue(currentValue + 1);
}

function decrementCounter() {
  var currentValue = getCurrentCounterValue();
  if (currentValue > 1) {
    setCounterValue(currentValue - 1);
  }
}

document.getElementById("decrease").addEventListener("click", decrementCounter);
document.getElementById("increase").addEventListener("click", incrementCounter);

function getUrlParameter(name) {
  const urlParams = new URLSearchParams(window.location.search);
  return urlParams.get(name);
}

function findProductByIdAndCategory(data, productId, category) {
  const id = parseInt(productId, 10);
  const normalizedCategory = category ? category.toLowerCase() : null;

  if (!data || !data.produse) {
    console.error("Invalid data structure");
    return null;
  }

  if (normalizedCategory) {
    const categoryKey = Object.keys(data.produse).find(
      (key) => key.toLowerCase() === normalizedCategory
    );
    if (categoryKey && data.produse[categoryKey]) {
      const product = data.produse[categoryKey].find((p) => p.id === id);
      if (product) return product;
    }
    console.error(`No product found with ID ${id} in category ${category}`);
    return null;
  }

  for (const categoryKey in data.produse) {
    if (Object.prototype.hasOwnProperty.call(data.produse, categoryKey)) {
      const product = data.produse[categoryKey].find((p) => p.id === id);
      if (product) return product;
    }
  }
  console.error(`No product found with ID ${id} across all categories`);
  return null;
}

function showNotification(product) {
  const existingNotification = document.querySelector(".notification");
  if (existingNotification) {
    existingNotification.remove();
  }

  const notification = document.createElement("div");
  notification.classList.add("notification");
  notification.innerHTML = `
        <div class="notification-content">
            <img src="${product.imagine}" alt="${product.nume}" class="notification-img">
            <div class="notification-text">
                <p class="notification-title" data-lang="notification-added">Adăugat în coș</p>
                <p class="notification-product">${product.nume}</p>
            </div>
        </div>
        <div class="notification-actions">
            <a href="../HTML/COS.html" class="view-cart" data-lang="notification-view-cart">Vezi coșul</a>
        </div>
    `;

  const languageManager = new LanguageManager(translations);
  languageManager.updateContent();

  document.body.appendChild(notification);
  requestAnimationFrame(() => notification.classList.add("show"));

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

function loadProductDetails() {
  const productId = getUrlParameter("id");
  const category = getUrlParameter("categorie");

  if (!productId) {
    console.error("No product ID found in URL");
    return;
  }

  fetch("../JSON/items.json")
    .then((response) => {
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      return response.json();
    })
    .then((data) => {
      const product = findProductByIdAndCategory(data, productId, category);

      if (!product) {
        console.error(
          `Product not found for ID ${productId}${
            category ? ` in category ${category}` : ""
          }`
        );
        return;
      }

      const mainImg = document.querySelector(".main-img img");
      const title = document.querySelector(".text h1");
      const price = document.querySelector(".text p");
      const size = document.querySelector(".bio p2:first-child");
      const description = document.querySelector(".bio p2:last-child");
      const linkedImgContainer = document.querySelector(".linked-img");
      const buyButton = document.querySelector(".buy-button");

      if (mainImg) mainImg.src = product.imagine || "default-image.jpg";
      if (title) title.textContent = product.nume || "Unnamed Product";
      if (price) price.textContent = product.pret || "Price not available";
      if (size) size.textContent = `Mărime: ${product.dimensiuni || "N/A"}`;
      if (description)
        description.textContent = `Descriere: ${
          product.descriere || "No description"
        }`;

      if (linkedImgContainer) linkedImgContainer.innerHTML = "";

      const allImages = [product.imagine];
      if (product["Imagini legate"] && product["Imagini legate"] !== "") {
        const linkedImages = Array.isArray(product["Imagini legate"])
          ? product["Imagini legate"]
          : [product["Imagini legate"]];
        allImages.push(...linkedImages);
      }

      allImages.forEach((imgSrc, index) => {
        if (imgSrc) {
          const imgDiv = document.createElement("div");
          imgDiv.className = "img-view";
          imgDiv.innerHTML = `<img src="${imgSrc}" alt="Product image" onerror="this.src='default-image.jpg'">`;
          linkedImgContainer.appendChild(imgDiv);

          const linkedImg = imgDiv.querySelector("img");
          if (index === 0) linkedImg.classList.add("active");

          linkedImg.addEventListener("click", () => {
            if (mainImg) {
              mainImg.src = linkedImg.src;
              document
                .querySelectorAll(".img-view img")
                .forEach((img) => img.classList.remove("active"));
              linkedImg.classList.add("active");
            }
          });
        }
      });

      if (buyButton) {
        buyButton.addEventListener("click", () => {
          showNotification(product, true);
        });
      }
    })
    .catch((error) => {
      console.error("Error loading product details:", error);
    });
}

window.addEventListener("DOMContentLoaded", loadProductDetails);

class ProductPage {
  constructor() {
    this.quantity = 1;
    this.product = null;
  }

  init() {
    this.initializeCounter();
    this.loadProductDetails();
  }

  async loadProductDetails() {
    const productId = getUrlParameter("id");
    const category = getUrlParameter("categorie");

    if (!productId) {
      console.error("No product ID found in URL");
      return;
    }

    try {
      console.log('Attempting to fetch:', '../JSON/items.json');
      const response = await fetch("../JSON/items.json");
      console.log('Response status:', response.status);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      console.log('Data loaded successfully');
      
      const product = this.findProductByIdAndCategory(data, productId, category);

      if (!product) {
        console.error(
          `Product not found for ID ${productId}${
            category ? ` in category ${category}` : ""
          }`
        );
        return;
      }

      this.product = product;
      this.updateProductUI();
      this.initializeAddToCart();
    } catch (error) {
      console.error("Error loading product details:", error);
      const mainContainer = document.querySelector(".main-img");
      if (mainContainer) {
        mainContainer.innerHTML = '<div class="error-message">Error loading product. Please try again later.</div>';
      }
    }
  }

  findProductByIdAndCategory(data, productId, category) {
    const id = parseInt(productId, 10);
    const normalizedCategory = category ? category.toLowerCase() : null;

    if (!data || !data.produse) {
      console.error("Invalid data structure");
      return null;
    }

    if (normalizedCategory) {
      const categoryKey = Object.keys(data.produse).find(
        (key) => key.toLowerCase() === normalizedCategory
      );
      if (categoryKey && data.produse[categoryKey]) {
        const product = data.produse[categoryKey].find((p) => p.id === id);
        if (product) return product;
      }
    }

    for (const categoryKey in data.produse) {
      if (Object.prototype.hasOwnProperty.call(data.produse, categoryKey)) {
        const product = data.produse[categoryKey].find((p) => p.id === id);
        if (product) return product;
      }
    }
    return null;
  }

  updateProductUI() {
    const mainImg = document.querySelector(".main-img img");
    const title = document.querySelector(".text h1");
    const price = document.querySelector(".text p");
    const size = document.querySelector(".bio p2:first-child");
    const description = document.querySelector(".bio p2:last-child");
    const linkedImgContainer = document.querySelector(".linked-img");

    if (mainImg) mainImg.src = this.product.imagine || "default-image.jpg";
    if (title) title.textContent = this.product.nume || "Unnamed Product";
    if (price) price.textContent = this.product.pret || "Price not available";
    if (size) size.textContent = `Mărime: ${this.product.dimensiuni || "N/A"}`;
    if (description)
      description.textContent = `Descriere: ${
        this.product.descriere || "No description"
      }`;

    this.updateLinkedImages(linkedImgContainer, mainImg);
  }

  updateLinkedImages(container, mainImg) {
    if (!container) return;

    container.innerHTML = "";
    const allImages = [this.product.imagine];

    if (this.product["Imagini legate"] && this.product["Imagini legate"] !== "") {
      const linkedImages = Array.isArray(this.product["Imagini legate"])
        ? this.product["Imagini legate"]
        : [this.product["Imagini legate"]];
      allImages.push(...linkedImages);
    }

    allImages.forEach((imgSrc, index) => {
      if (imgSrc) {
        const imgDiv = document.createElement("div");
        imgDiv.className = "img-view";
        imgDiv.innerHTML = `<img src="${imgSrc}" alt="Product image" onerror="this.src='default-image.jpg'">`;
        container.appendChild(imgDiv);

        const linkedImg = imgDiv.querySelector("img");
        if (index === 0) linkedImg.classList.add("active");

        linkedImg.addEventListener("click", () => {
          if (mainImg) {
            mainImg.src = linkedImg.src;
            container
              .querySelectorAll("img")
              .forEach((img) => img.classList.remove("active"));
            linkedImg.classList.add("active");
          }
        });
      }
    });
  }

  initializeCounter() {
    const counterDisplay = document.getElementById("counter-display");
    if (!counterDisplay) return;

    document.getElementById("decrease")?.addEventListener("click", () => {
      if (this.quantity > 1) {
        this.quantity--;
        counterDisplay.value = this.quantity;
      }
    });

    document.getElementById("increase")?.addEventListener("click", () => {
      this.quantity++;
      counterDisplay.value = this.quantity;
    });
  }

  initializeAddToCart() {
    const addToCartBtn = document.getElementById("addToCart");
    if (addToCartBtn) {
      addToCartBtn.addEventListener("click", () => this.addToCart());
    }
  }

  addToCart() {
    if (!this.product) return;

    let cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const existingItem = cart.find((item) => item.id === this.product.id);

    if (existingItem) {
      existingItem.quantity += this.quantity;
    } else {
      cart.push({
        ...this.product,
        quantity: this.quantity,
      });
    }

    localStorage.setItem("cart", JSON.stringify(cart));
    this.updateCartCount();
    this.showNotification();
  }

  updateCartCount() {
    const cartCounts = document.querySelectorAll(".cart-count");
    const cart = JSON.parse(localStorage.getItem("cart") || "[]");
    const totalItems = cart.reduce((sum, item) => sum + item.quantity, 0);
    cartCounts.forEach((count) => (count.textContent = totalItems));
  }

  showNotification() {
    const notification = document.createElement("div");
    notification.className = "notification";
    notification.innerHTML = `
      <div class="notification-content">
        <img src="${this.product.imagine}" alt="${this.product.nume}" class="notification-img">
        <div class="notification-text">
          <p class="notification-title" data-lang="product-added">Adăugat în coș</p>
          <p class="notification-product">${this.product.nume}</p>
        </div>
      </div>
      <div class="notification-actions">
        <a href="../HTML/COS.html" class="view-cart" data-lang="product-view-cart">Vezi coșul</a>
      </div>
    `;

    document.body.appendChild(notification);

    if (typeof LanguageManager !== 'undefined' && typeof translations !== 'undefined') {
      const languageManager = new LanguageManager(translations);
      languageManager.updateContent();
    }

    requestAnimationFrame(() => notification.classList.add("show"));

    setTimeout(() => {
      notification.classList.remove("show");
      setTimeout(() => notification.remove(), 300);
    }, 3000);
  }
}

// Инициализация после загрузки DOM
document.addEventListener("DOMContentLoaded", () => {
  const productPage = new ProductPage();
  productPage.init();
});
