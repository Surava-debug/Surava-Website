document.addEventListener("DOMContentLoaded", () => {
  const toggle = document.querySelector(".nav-toggle");
  const links = document.querySelector(".nav-links");

  if (toggle && links) {
    toggle.addEventListener("click", () => {
      links.classList.toggle("open");
    });
  }

  // Allow tap-to-open dropdowns on mobile
  document.querySelectorAll(".has-dropdown > a").forEach((trigger) => {
    trigger.addEventListener("click", (e) => {
      if (window.innerWidth <= 720) {
        e.preventDefault();
        trigger.parentElement.classList.toggle("open");
      }
    });
  });

  // Contact form: prevent real submission (static site)
  const form = document.querySelector("#contact-form");
  if (form) {
    form.addEventListener("submit", (e) => {
      e.preventDefault();
      const note = document.querySelector("#form-note");
      if (note) {
        note.textContent = "Thank you. Your message has been received — our team will respond within 1–2 business days.";
        note.style.display = "block";
      }
      form.reset();
    });
  }

  // Highlight current nav link
  const path = window.location.pathname.split("/").pop() || "index.html";
  document.querySelectorAll(".nav-links > a, .has-dropdown > a").forEach((a) => {
    if (a.getAttribute("href") === path) {
      a.style.color = "var(--color-accent-dark)";
    }
  });
});
