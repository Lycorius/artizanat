class CartManager {
  constructor() {
    this.cartContainer = document.querySelector(".cart-items");
    this.totalElement = document.querySelector(".cart-total");
    this.cartCountElements = document.querySelectorAll(".cart-count");
    this.langManager = new LanguageManager(translations);
    this.init();
  }

  init() {
    this.setupStorageListener();
    this.setupLanguageListener();
    this.renderCart();
    this.bindEvents();
    this.updateCartCount();
    this.setupOrderForm();
  }

  static getCart() {
    return JSON.parse(localStorage.getItem("cart") || "[]");
  }

  static updateCart(cart) {
    localStorage.setItem("cart", JSON.stringify(cart));
    window.dispatchEvent(new StorageEvent("storage", { key: "cart", newValue: JSON.stringify(cart) }));
  }

  setupStorageListener() {
    window.addEventListener("storage", (e) => {
      if (e.key === "cart") {
        this.renderCart();
        this.updateCartCount();
      }
    });
  }

  setupLanguageListener() {
    window.addEventListener("languageChanged", () => {
      this.renderCart();
      this.updateTotal();
      const emptyCartElement = this.cartContainer?.querySelector('.empty-cart');
      if (emptyCartElement) {
        emptyCartElement.textContent = this.langManager.translations[this.langManager.currentLang]["cart-empty"];
      }
    });
  }

  updateCartCount() {
    const totalItems = CartManager.getCart().reduce((sum, item) => sum + (item.quantity || 1), 0);
    this.cartCountElements.forEach(element => {
      element.textContent = totalItems;
      element.style.display = totalItems > 0 ? "flex" : "none";
    });
  }

  renderCart() {
    if (!this.cartContainer) return;

    const cart = CartManager.getCart();
    if (cart.length === 0) {
      this.cartContainer.innerHTML = `<p class="empty-cart" data-lang="cart-empty"></p>`;
      this.updateTotal(0);
      return;
    }

    this.cartContainer.innerHTML = cart.map(item => this.createCartItemHTML(item)).join("");
    this.updateTotal();
  }

  createCartItemHTML(item) {
    return `
      <div class="cart-item" data-id="${item.id}" data-category="${item.categorie}">
        <img src="${item.imagine}" alt="${item.nume}">
        <div class="item-details">
          <h3>${item.nume}</h3>
          <div class="item-controls">
            <div class="quantity-controls">
              <button class="quantity-btn minus">-</button>
              <span class="quantity">${item.quantity}</span>
              <button class="quantity-btn plus">+</button>
            </div>
            <p class="item-price">${item.pret}</p>
            <button class="remove-btn">×</button>
          </div>
        </div>
      </div>
    `;
  }

  updateTotal() {
    if (!this.totalElement) return;
    
    const total = CartManager.getCart().reduce((sum, item) => {
      const price = parseFloat(item.pret.replace(" MDL", ""));
      return sum + price * item.quantity;
    }, 0);

    const translation = this.langManager.translations[this.langManager.currentLang]["cart-total"];
    this.totalElement.innerHTML = `<span data-lang="cart-total">${translation}</span> ${total.toFixed(2)} MDL`;
  }

  updateItemQuantity(productId, change) {
    const cart = CartManager.getCart();
    const item = cart.find(i => i.id === productId);
    if (item) {
      item.quantity = Math.max(1, (item.quantity || 1) + change);
      CartManager.updateCart(cart);
    }
  }

  removeItem(productId) {
    const cart = CartManager.getCart().filter(item => item.id !== productId);
    CartManager.updateCart(cart);
  }

  bindEvents() {
    if (!this.cartContainer) return;

    this.cartContainer.addEventListener("click", (e) => {
      const cartItem = e.target.closest(".cart-item");
      if (!cartItem) return;

      const productId = parseInt(cartItem.dataset.id);
      if (e.target.classList.contains("plus")) {
        this.updateItemQuantity(productId, 1);
      } else if (e.target.classList.contains("minus")) {
        this.updateItemQuantity(productId, -1);
      } else if (e.target.classList.contains("remove-btn")) {
        this.removeItem(productId);
      }
    });
  }

  setupOrderForm() {
    const modal = document.getElementById("orderModal");
    const checkoutBtn = document.querySelector(".checkout-btn");
    const closeBtn = document.querySelector(".close-modal");
    const orderForm = document.getElementById("orderForm");
    if (!modal || !checkoutBtn || !closeBtn || !orderForm) return;

    const closeModal = () => {
      modal.classList.remove("active");
      setTimeout(() => modal.style.display = "none", 300);
    };

    checkoutBtn.addEventListener("click", () => this.handleCheckoutClick(modal, orderForm));
    closeBtn.addEventListener("click", closeModal);
    window.addEventListener("click", (e) => e.target === modal && closeModal());
    orderForm.addEventListener("submit", (e) => this.handleOrderSubmit(e, modal));
  }

  handleCheckoutClick(modal, orderForm) {
    const cart = CartManager.getCart();
    if (cart.length === 0) {
      alert(this.langManager.translations[this.langManager.currentLang]["cart-empty"]);
      return;
    }

    modal.style.display = "block";
    modal.offsetHeight; // Force reflow
    modal.classList.add("active");

    const orderDetails = this.generateOrderDetails(cart);
    document.getElementById("orderDetails").value = orderDetails;

    const inputs = orderForm.querySelectorAll("input, textarea");
    inputs.forEach(input => {
      const placeholderKey = `modal-${input.id}-placeholder`;
      const translation = this.langManager.translations[this.langManager.currentLang][placeholderKey];
      if (translation) input.placeholder = translation;
    });
  }

  generateOrderDetails(cart) {
    const orderItems = cart.map(item => {
      const price = parseFloat(item.pret.replace(" MDL", ""));
      return `${item.nume} - ${item.quantity}x - ${price.toFixed(2)} MDL`;
    }).join("\n");

    const total = cart.reduce((sum, item) => {
      const price = parseFloat(item.pret.replace(" MDL", ""));
      return sum + price * item.quantity;
    }, 0);

    return `${orderItems}\n\n${this.langManager.translations[this.langManager.currentLang]["cart-total"]}: ${total.toFixed(2)} MDL`;
  }

  async handleOrderSubmit(e, modal) {
    e.preventDefault();
    const form = e.target;
    const submitBtn = form.querySelector("button[type='submit']");
    const originalText = submitBtn.textContent;

    submitBtn.disabled = true;
    submitBtn.textContent = this.langManager.translations[this.langManager.currentLang]["sending"];

    try {
      const response = await fetch(form.action, {
        method: "POST",
        body: new FormData(form)
      });

      if (!response.ok) throw new Error("Form submission failed");

      localStorage.removeItem("cart");
      this.renderCart();
      this.updateCartCount();
      modal.style.display = "none";
      alert(this.langManager.translations[this.langManager.currentLang]["notification-success"]);
    } catch (error) {
      alert(this.langManager.translations[this.langManager.currentLang]["notification-error"]);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = originalText;
    }
  }
}

document.addEventListener("DOMContentLoaded", () => {
  new CartManager();
});

window.CartManager = CartManager;
