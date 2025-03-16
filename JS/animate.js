const CONFIG = {
  SLIDE_SHOW: 5,
  AUTO_PLAY_DELAY: 3000,
  SWIPE_THRESHOLD: 100,
  TRANSITION_TIME: 500,
  MOBILE_BREAKPOINT: 768,
};

class Carousel {
  constructor() {
    this.state = {
      currentIndex: 2,
      isTransitioning: false,
      autoScrolling: true,
      touchStartX: 0,
      touchEndX: 0,
      lastInteractionTime: 0
    };

    this.elements = this.initializeElements();
    if (!this.elements.track) return;

    this.setupCarousel();
    this.bindEvents();
    this.startAutoScroll();
  }

  initializeElements() {
    return {
      track: document.querySelector(".carousel-track"),
      nextBtn: document.querySelector(".carousel-btn.next"),
      prevBtn: document.querySelector(".carousel-btn.prev"),
      indicators: document.querySelectorAll(".indicator"),
      slides: null,
      slideWidth: 0
    };
  }

  setupCarousel() {
    this.elements.slides = Array.from(this.elements.track.children);
    this.elements.slideWidth = this.elements.slides[0].getBoundingClientRect().width;
    
    this.setupInfiniteSlides();
    this.updateUI();
    this.updateTransform(-this.state.currentIndex * this.elements.slideWidth, false);
  }

  setupInfiniteSlides() {
    const cloneSlides = (slides, isStart = true) => {
      return slides.map(slide => {
        const clone = slide.cloneNode(true);
        clone.classList.add("clone");
        isStart ? this.elements.track.appendChild(clone) : 
                 this.elements.track.insertBefore(clone, this.elements.track.firstChild);
        return clone;
      });
    };

    const startSlides = this.elements.slides.slice(0, CONFIG.SLIDE_SHOW);
    const endSlides = this.elements.slides.slice(-CONFIG.SLIDE_SHOW);

    cloneSlides(startSlides, true);
    cloneSlides(endSlides.reverse(), false);
  }

  updateTransform(position, transition = true) {
    if (!this.elements.track) return;

    this.elements.track.style.transition = transition ? 
      `transform ${CONFIG.TRANSITION_TIME}ms ease-in-out` : "none";
    this.elements.track.style.transform = `translateX(${position}px)`;
  }

  updateUI() {
    this.elements.slides.forEach((slide, i) => 
      slide.classList.toggle("current-slide", i === this.state.currentIndex));

    this.elements.indicators.forEach((indicator, i) => 
      indicator.classList.toggle("active", i === (this.state.currentIndex - 2) % CONFIG.SLIDE_SHOW));
  }

  moveToSlide(index, smooth = true) {
    if (this.state.isTransitioning) return;

    this.state.isTransitioning = true;
    this.state.currentIndex = index;
    this.state.lastInteractionTime = Date.now();

    this.updateTransform(-this.state.currentIndex * this.elements.slideWidth, smooth);
    this.updateUI();
  }

  handleInfiniteScroll() {
    if (this.state.currentIndex <= 1) {
      this.state.currentIndex = this.elements.slides.length - 3;
    } else if (this.state.currentIndex >= this.elements.slides.length - 2) {
      this.state.currentIndex = 2;
    }

    this.updateTransform(-this.state.currentIndex * this.elements.slideWidth, false);
    this.updateUI();
    this.state.isTransitioning = false;
  }

  startAutoScroll() {
    if (!this.state.autoScrolling) return;

    const now = Date.now();
    if (now - this.state.lastInteractionTime < CONFIG.AUTO_PLAY_DELAY) {
      requestAnimationFrame(() => this.startAutoScroll());
      return;
    }

    this.moveToSlide(this.state.currentIndex + 1, true);
    setTimeout(() => requestAnimationFrame(() => this.startAutoScroll()), CONFIG.AUTO_PLAY_DELAY);
  }

  handleTouchStart(e) {
    this.state.touchStartX = e.touches[0].clientX;
    this.state.autoScrolling = false;
    this.state.lastInteractionTime = Date.now();
  }

  handleTouchMove(e) {
    if (this.state.isTransitioning) return;

    this.state.touchEndX = e.touches[0].clientX;
    const diff = this.state.touchStartX - this.state.touchEndX;

    // Добавляем сопротивление при свайпе
    const resistance = 0.8;
    const position = -this.state.currentIndex * this.elements.slideWidth - (diff * resistance);
    this.updateTransform(position, false);
  }

  handleTouchEnd() {
    const diff = this.state.touchStartX - this.state.touchEndX;
    
    if (Math.abs(diff) > CONFIG.SWIPE_THRESHOLD) {
      this.moveToSlide(this.state.currentIndex + (diff > 0 ? 1 : -1));
    } else {
      this.moveToSlide(this.state.currentIndex);
    }

    setTimeout(() => {
      this.state.autoScrolling = true;
      this.startAutoScroll();
    }, CONFIG.AUTO_PLAY_DELAY);
  }

  bindEvents() {
    // Touch events
    this.elements.track.addEventListener("touchstart", (e) => this.handleTouchStart(e), { passive: true });
    this.elements.track.addEventListener("touchmove", (e) => this.handleTouchMove(e), { passive: true });
    this.elements.track.addEventListener("touchend", () => this.handleTouchEnd());

    // Transition end
    this.elements.track.addEventListener("transitionend", () => this.handleInfiniteScroll());

    // Navigation buttons
    this.elements.nextBtn?.addEventListener("click", () => {
      this.state.lastInteractionTime = Date.now();
      this.moveToSlide(this.state.currentIndex + 1);
    });

    this.elements.prevBtn?.addEventListener("click", () => {
      this.state.lastInteractionTime = Date.now();
      this.moveToSlide(this.state.currentIndex - 1);
    });

    // Indicators
    this.elements.indicators.forEach((indicator, i) => {
      indicator.addEventListener("click", () => {
        this.state.lastInteractionTime = Date.now();
        this.moveToSlide(i + 2);
      });
    });

    // Mouse enter/leave
    this.elements.track.addEventListener("mouseenter", () => {
      this.state.autoScrolling = false;
    });

    this.elements.track.addEventListener("mouseleave", () => {
      this.state.autoScrolling = true;
      this.startAutoScroll();
    });

    // Visibility change
    document.addEventListener("visibilitychange", () => {
      this.state.autoScrolling = !document.hidden;
      if (!document.hidden) this.startAutoScroll();
    });

    // Window resize
    let resizeTimeout;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        this.elements.slideWidth = this.elements.slides[0].getBoundingClientRect().width;
        this.updateTransform(-this.state.currentIndex * this.elements.slideWidth, false);
      }, 250);
    });
  }
}

class LanguageManager {
  constructor(translations) {
    this.translations = translations;
    this.currentLang = localStorage.getItem("language") || "ro";
    this.selectors = {
      desktop: document.getElementById("language"),
      mobile: document.getElementById("language-mobile")
    };
    this.init();
  }

  init() {
    if (this.selectors.desktop) {
      this.selectors.desktop.value = this.currentLang;
      this.selectors.desktop.addEventListener("change", (e) => this.changeLanguage(e.target.value));
    }

    if (this.selectors.mobile) {
      this.selectors.mobile.value = this.currentLang;
      this.selectors.mobile.addEventListener("change", (e) => this.changeLanguage(e.target.value));
    }

    this.updateContent();
  }

  changeLanguage(lang) {
    this.currentLang = lang;
    localStorage.setItem("language", lang);

    Object.values(this.selectors).forEach(selector => {
      if (selector) selector.value = lang;
    });

    this.updateContent();
    window.dispatchEvent(new Event("languageChanged"));
  }

  updateContent() {
    const currentTranslations = this.translations[this.currentLang];
    
    document.querySelectorAll("[data-lang]").forEach(element => {
      const key = element.getAttribute("data-lang");
      element.textContent = currentTranslations[key] || key;
    });

    document.querySelectorAll("[data-currency]").forEach(element => {
      element.textContent = "MDL";
    });
  }
}

class MobileNav {
  constructor() {
    this.hamburger = document.querySelector(".hamburger-menu");
    this.mobileNav = document.querySelector(".mobile-nav");
    this.body = document.body;
    this.init();
  }

  init() {
    if (!this.hamburger || !this.mobileNav) return;

    this.hamburger.addEventListener("click", () => {
      this.hamburger.classList.toggle("active");
      this.mobileNav.classList.toggle("active");
      this.body.classList.toggle("no-scroll");
    });

    document.addEventListener("click", (e) => {
      if (
        !this.mobileNav.contains(e.target) &&
        !this.hamburger.contains(e.target) &&
        this.mobileNav.classList.contains("active")
      ) {
        this.hamburger.classList.remove("active");
        this.mobileNav.classList.remove("active");
        this.body.classList.remove("no-scroll");
      }
    });

    window.addEventListener("resize", () => {
      if (window.innerWidth > 768) {
        this.hamburger.classList.remove("active");
        this.mobileNav.classList.remove("active");
        this.body.classList.remove("no-scroll");
      }
    });
  }
}

class OrderFormManager {
  constructor(formId, langManager) {
    this.form = document.getElementById(formId);
    this.langManager = langManager;
    this.init();
  }

  init() {
    if (!this.form) return;
    this.bindEvents();
    this.setupFormSubmit();
  }

  bindEvents() {
    const inputs = this.form.querySelectorAll("input, textarea");
    inputs.forEach(input => {
      input.addEventListener("input", () => this.validateField(input));
      input.addEventListener("blur", () => this.validateField(input));
    });

    this.form.addEventListener("submit", (e) => this.handleSubmit(e));
  }

  setupFormSubmit() {
    const formSubmitFields = {
      _subject: "Новый заказ - Artizanat",
      _template: "table",
      _next: window.location.href,
      _autoresponse: this.langManager.translations[this.langManager.currentLang]["notification-success"],
      _captcha: false
    };

    Object.entries(formSubmitFields).forEach(([key, value]) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = value;
      this.form.appendChild(input);
    });
  }

  validateField(field) {
    const value = field.value.trim();
    const errorElement = field.nextElementSibling;
    
    if (!errorElement || !errorElement.classList.contains("error-message")) {
      return true;
    }

    let isValid = true;
    let errorMessage = "";

    switch (field.id) {
      case "name":
        if (value.length < 3 || value.length > 50) {
          isValid = false;
          errorMessage = this.langManager.translations[this.langManager.currentLang]["invalid-name"];
        }
        break;
      case "phone":
        const phoneRegex = /^\+?[0-9]{10,15}$/;
        if (!phoneRegex.test(value.replace(/\D/g, ""))) {
          isValid = false;
          errorMessage = this.langManager.translations[this.langManager.currentLang]["invalid-phone"];
        }
        break;
      case "email":
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!emailRegex.test(value)) {
          isValid = false;
          errorMessage = this.langManager.translations[this.langManager.currentLang]["invalid-email"];
        }
        break;
      case "address":
        if (value.length < 10) {
          isValid = false;
          errorMessage = this.langManager.translations[this.langManager.currentLang]["invalid-address"];
        }
        break;
    }

    if (!isValid) {
      field.classList.add("invalid");
      errorElement.textContent = errorMessage;
      errorElement.style.display = "block";
    } else {
      field.classList.remove("invalid");
      errorElement.style.display = "none";
    }

    return isValid;
  }

  validateForm() {
    const requiredFields = this.form.querySelectorAll("[required]");
    let isValid = true;

    requiredFields.forEach(field => {
      if (!this.validateField(field)) {
        isValid = false;
      }
    });

    return isValid;
  }

  async handleSubmit(e) {
    e.preventDefault();

    if (!this.validateForm()) {
      return;
    }

    const submitButton = this.form.querySelector('button[type="submit"]');
    submitButton.disabled = true;
    submitButton.textContent = this.langManager.translations[this.langManager.currentLang]["sending"];

    try {
      const response = await fetch(this.form.action, {
        method: "POST",
        body: new FormData(this.form)
      });

      if (!response.ok) {
        throw new Error("Network response was not ok");
      }

      createNotification("notification-success", this.langManager);
      this.form.reset();

      const modal = document.getElementById("orderModal");
      if (modal) {
        modal.classList.remove("active");
        setTimeout(() => {
          modal.style.display = "none";
        }, 300);
      }
    } catch (error) {
      console.error("Error:", error);
      createNotification("notification-error", this.langManager);
    } finally {
      submitButton.disabled = false;
      submitButton.textContent = this.langManager.translations[this.langManager.currentLang]["modal-confirm"];
    }
  }
}

const translations = {
  ro: {
    "header-about": "Despre",
    "header-services": "Servicii",
    "header-catalog": "Catalog",
    "header-contact": "Contacte",
    "header-cart": "Coș",
    "hero-title": "PĂSTRĂM TRADIȚIA",
    "hero-subtitle": "Platouri de lemn și veselă de lut",
    "hero-button": "Vezi catalogul",
    "about-title": "Despre noi",
    "about-description": "Pasionați de obiceiuri și tradiții, am decis să împărtășim cu voi cele mai reușite produse artizanale ce ne ajută să păstram tradițiile autohtone și să îi bucurăm pe cei dragi!",
    "about-years": "De 5 ani în afacere",
    "about-custom": "Lucrări personalizate",
    "about-clients": "300+ de clienți mulțumiți",
    "services-title": "Servicii",
    "services-description": "Comercializarea veselei din lut tradiționale, platouri din lemn (frasin sau stejar), suporturi pentru vin (vinoteca) și seturi cadou la discreția clientului. Livrarea produselor prin poșta în țară și peste hotare.",
    "contact-title": "Contactează-ne",
    "contact-send-message": "Trimite-ne un mesaj",
    "contact-name": "Nume Prenume",
    "contact-phone": "Telefon",
    "contact-email": "Email",
    "contact-message": "Mesajul",
    "contact-button": "Trimite mesajul",
    "contact-name-placeholder": "Ex. Vasile Lupu",
    "contact-phone-placeholder": "Ex. +373 79 123 456",
    "contact-email-placeholder": "Ex. VasileLupu@mail.com",
    "contact-message-placeholder": "...",
    "footer-info": "Informații generale",
    "footer-home": "Acasă",
    "footer-catalog": "Catalog",
    "footer-about": "Despre",
    "footer-services": "Servicii",
    "footer-contact": "ARTIZANAT CAHUL",
    "footer-phone": "+(373) 60 132 630",
    "footer-address": 'Cahul, Centrul Comercial "Globus", str. 31 August 13B',
    "cart-title": "Coșul meu",
    "cart-total": "Total:",
    "cart-empty": "Coșul dvs. este gol",
    "cart-checkout": "Finalizează comanda",
    "cart-return": "Înapoi la catalog",
    "modal-title": "Finalizare comandă",
    "modal-name": "Nume Prenume *",
    "modal-phone": "Telefon *",
    "modal-email": "Email *",
    "modal-address": "Adresa de livrare *",
    "modal-comments": "Comentarii",
    "modal-confirm": "Confirmă comanda",
    "modal-name-placeholder": "Ex. Vasile Lupu",
    "modal-phone-placeholder": "Ex. +373 79 123 456",
    "modal-email-placeholder": "Ex. VasileLupu@mail.com",
    "modal-address-placeholder": "Ex. Cahul, str. 31 August 13B",
    "modal-comments-placeholder": "Ex. Livrare în weekend",
    "catalog-platouri": "Platouri din lemn",
    "catalog-oale": "Oale din lut",
    "catalog-vinoteca": "Vinotecă",
    "catalog-title": "Catalog",
    "product-add": "Adaugă în coș",
    "notification-added": "Adăugat în coș",
    "notification-view-cart": "Vezi coșul",
    "notification-success": "Comanda a fost trimisă cu succes!",
    "notification-error": "Eroare la trimitere. Încercați din nou.",
    "product-details": "Detalii:",
    "product-size": "Mărime:",
    "product-description": "Descriere:",
    "product-currency": "MDL",
    "required-field": "Acest câmp este obligatoriu",
    "invalid-phone": "Număr de telefon invalid. Folosiți formatul: +373XXXXXXXXX",
    "invalid-email": "Email invalid. Folosiți formatul: exemplu@mail.com",
    "invalid-name": "Numele trebuie să aibă între 3 și 50 de caractere",
    "invalid-address": "Adresa trebuie să aibă cel puțin 10 caractere",
    "sending": "Se trimite...",
    "order-subject": "Comandă nouă - Artizanat",
    "order-template": "table",
    "order-autoresponse": "Vă mulțumim pentru comandă! Vă vom contacta în curând.",
  },
  ru: {
    "header-about": "О нас",
    "header-services": "Услуги",
    "header-catalog": "Каталог",
    "header-contact": "Контакты",
    "header-cart": "Корзина",
    "hero-title": "СОХРАНЯЕМ ТРАДИЦИИ",
    "hero-subtitle": "Деревянные блюда и глиняная посуда",
    "hero-button": "Перейти в каталог",
    "about-title": "О нас",
    "about-description": "Увлеченные обычаями и традициями, мы решили поделиться с вами лучшими изделиями ручной работы, которые помогают нам сохранять местные традиции и радовать близких!",
    "about-years": "5 лет в бизнесе",
    "about-custom": "Индивидуальные работы",
    "about-clients": "Более 300 довольных клиентов",
    "services-title": "Услуги",
    "services-description": "Продажа традиционной глиняной посуды, деревянных блюд (из ясеня или дуба), винных подставок (винотека) и подарочных наборов по желанию клиента. Доставка товаров почтой по стране и за границу.",
    "contact-title": "Свяжитесь с нами",
    "contact-send-message": "Отправьте нам сообщение",
    "contact-name": "Имя и фамилия",
    "contact-phone": "Телефон",
    "contact-email": "Электронная почта",
    "contact-message": "Сообщение",
    "contact-button": "Отправить сообщение",
    "contact-name-placeholder": "Например: Василий Лупу",
    "contact-phone-placeholder": "Например: +373 79 123 456",
    "contact-email-placeholder": "Например: VasileLupu@mail.com",
    "contact-message-placeholder": "...",
    "footer-info": "Общая информация",
    "footer-home": "Главная",
    "footer-catalog": "Каталог",
    "footer-about": "О нас",
    "footer-services": "Услуги",
    "footer-contact": "ARTIZANAT CAHUL",
    "footer-phone": "+(373) 60 132 630",
    "footer-address": 'Кахул, Торговый центр "Глобус", ул. 31 Августа 13Б',
    "cart-title": "Моя корзина",
    "cart-total": "Итого:",
    "cart-empty": "Ваша корзина пуста",
    "cart-checkout": "Оформить заказ",
    "cart-return": "Вернуться в каталог",
    "modal-title": "Оформление заказа",
    "modal-name": "Имя и фамилия *",
    "modal-phone": "Телефон *",
    "modal-email": "Электронная почта *",
    "modal-address": "Адрес доставки *",
    "modal-comments": "Комментарии",
    "modal-confirm": "Подтвердить заказ",
    "modal-name-placeholder": "Например: Василий Лупу",
    "modal-phone-placeholder": "Например: +373 79 123 456",
    "modal-email-placeholder": "Например: VasileLupu@mail.com",
    "modal-address-placeholder": "Например: Кахул, ул. 31 Августа 13Б",
    "modal-comments-placeholder": "Например: Доставка в выходной день",
    "catalog-platouri": "Деревянные блюда",
    "catalog-oale": "Глиняная посуда",
    "catalog-vinoteca": "Винотека",
    "catalog-title": "Каталог",
    "product-add": "Добавить в корзину",
    "notification-added": "Добавлено в корзину",
    "notification-view-cart": "Перейти в корзину",
    "notification-success": "Заказ успешно отправлен!",
    "notification-error": "Ошибка при отправке. Пожалуйста, попробуйте снова.",
    "product-details": "Характеристики:",
    "product-size": "Размер:",
    "product-description": "Описание:",
    "product-currency": "MDL",
    "required-field": "Это поле обязательно для заполнения",
    "invalid-phone": "Неверный формат номера телефона. Используйте формат: +373XXXXXXXXX",
    "invalid-email": "Неверный формат электронной почты. Используйте формат: example@mail.com",
    "invalid-name": "Имя должно содержать от 3 до 50 символов",
    "invalid-address": "Адрес должен содержать не менее 10 символов",
    "sending": "Отправка...",
    "order-subject": "Новый заказ - Artizanat",
    "order-template": "table",
    "order-autoresponse": "Спасибо за заказ! Мы свяжемся с вами в ближайшее время.",
  },
  en: {
    "header-about": "About Us",
    "header-services": "Services",
    "header-catalog": "Catalog",
    "header-contact": "Contact",
    "header-cart": "Cart",
    "hero-title": "PRESERVING TRADITION",
    "hero-subtitle": "Wooden platters and clay tableware",
    "hero-button": "Go to shop",
    "about-title": "About Us",
    "about-description": "Passionate about customs and traditions, we decided to share with you the best handmade products that help us preserve local traditions and delight our loved ones!",
    "about-years": "5 years in business",
    "about-custom": "Custom works",
    "about-clients": "300+ satisfied clients",
    "services-title": "Services",
    "services-description": "Selling traditional clay tableware, wooden platters (ash or oak), wine racks (vinoteca), and gift sets at the client's discretion. Product delivery by mail within the country and abroad.",
    "contact-title": "Contact Us",
    "contact-send-message": "Send us a message",
    "contact-name": "Full Name",
    "contact-phone": "Phone",
    "contact-email": "Email",
    "contact-message": "Message",
    "contact-button": "Send message",
    "contact-name-placeholder": "E.g. Vasile Lupu",
    "contact-phone-placeholder": "E.g. +373 79 123 456",
    "contact-email-placeholder": "E.g. VasileLupu@mail.com",
    "contact-message-placeholder": "...",
    "footer-info": "General Information",
    "footer-home": "Home",
    "footer-catalog": "Catalog",
    "footer-about": "About",
    "footer-services": "Services",
    "footer-contact": "ARTIZANAT CAHUL",
    "footer-phone": "+(373) 60 132 630",
    "footer-address": "Cahul, Globus Shopping Center, 31 August 13B",
    "cart-title": "My Cart",
    "cart-total": "Total:",
    "cart-empty": "Your cart is empty",
    "cart-checkout": "Checkout",
    "cart-return": "Back to catalog",
    "modal-title": "Complete Order",
    "modal-name": "Full Name *",
    "modal-phone": "Phone *",
    "modal-email": "Email *",
    "modal-address": "Delivery Address *",
    "modal-comments": "Comments",
    "modal-confirm": "Confirm Order",
    "modal-name-placeholder": "E.g. Vasile Lupu",
    "modal-phone-placeholder": "E.g. +373 79 123 456",
    "modal-email-placeholder": "E.g. VasileLupu@mail.com",
    "modal-address-placeholder": "E.g. Cahul, 31 August 13B",
    "modal-comments-placeholder": "E.g. Weekend delivery",
    "catalog-platouri": "Wooden Platters",
    "catalog-oale": "Clay Pots",
    "catalog-vinoteca": "Wine Racks",
    "catalog-title": "Catalog",
    "product-add": "Add to Cart",
    "notification-added": "Added to Cart",
    "notification-view-cart": "View Cart",
    "notification-success": "Order sent successfully!",
    "notification-error": "Error sending. Please try again.",
    "product-details": "Details:",
    "product-size": "Size:",
    "product-description": "Description:",
    "product-currency": "MDL",
    "required-field": "This field is required",
    "invalid-phone": "Invalid phone number format. Use format: +373XXXXXXXXX",
    "invalid-email": "Invalid email format. Use format: example@mail.com",
    "invalid-name": "Name must be between 3 and 50 characters",
    "invalid-address": "Address must be at least 10 characters",
    "sending": "Sending...",
    "order-subject": "New Order - Artizanat",
    "order-template": "table",
    "order-autoresponse": "Thank you for your order! We will contact you soon.",
  },
};

function createNotification(messageKey, langManager) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = langManager.translations[langManager.currentLang][messageKey] || messageKey;
  document.body.appendChild(notification);

  setTimeout(() => notification.classList.add("show"), 10);
  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => notification.remove(), 300);
  }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
  const langManager = new LanguageManager(translations);
  new Carousel();
  new MobileNav();
  new OrderFormManager("orderForm", langManager);
});