function createNotification(message) {
  const notification = document.createElement("div");
  notification.className = "notification";
  notification.textContent = message;

  document.body.appendChild(notification);

  setTimeout(() => {
    notification.classList.add("show");
  }, 10);

  setTimeout(() => {
    notification.classList.remove("show");
    setTimeout(() => {
      notification.remove();
    }, 300);
  }, 3000);
}

document.addEventListener("DOMContentLoaded", () => {
  const contactForm = document.querySelector(".contact-form form");

  if (contactForm) {
    contactForm.addEventListener("submit", function (event) {
      event.preventDefault();

      const name = document.getElementById("name").value.trim();
      const phone = document.getElementById("phone").value.trim();
      const email = document.getElementById("email").value.trim();
      const message = document.getElementById("message").value.trim();

      if (name && phone && email && message) {
        createNotification("Mulțumim pentru mesaj!");

        const formData = new FormData(contactForm);

        fetch(contactForm.action, {
          method: "POST",
          body: formData,
        })
          .then(() => {
            contactForm.reset();
          })
          .catch((error) => {
            console.error("Error:", error);
            createNotification("Eroare la trimitere. Încercați din nou.");
          });
      }
    });
  }
}); 