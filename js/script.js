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

  // Contact form: real submission via Web3Forms (static-site friendly form backend)
  const form = document.querySelector("#contact-form");
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const note = document.querySelector("#form-note");
      const btn = form.querySelector("button[type=submit]");
      const originalBtnText = btn ? btn.textContent : "";
      if (btn) { btn.disabled = true; btn.textContent = "Sending..."; }

      try {
        const formData = new FormData(form);
        const response = await fetch("https://api.web3forms.com/submit", {
          method: "POST",
          headers: { "Accept": "application/json" },
          body: formData,
        });
        const result = await response.json();

        if (note) {
          note.style.display = "block";
          if (response.status === 200 && result.success) {
            note.style.color = "var(--color-accent-dark)";
            note.textContent = "Thank you. Your message has been received — our team will respond within 1–2 business days.";
            form.reset();
          } else {
            note.style.color = "#B3261E";
            note.textContent = "Something went wrong sending your message. Please email us directly at info@suravacapital.ch.";
          }
        }
      } catch (err) {
        if (note) {
          note.style.display = "block";
          note.style.color = "#B3261E";
          note.textContent = "Something went wrong sending your message. Please email us directly at info@suravacapital.ch.";
        }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = originalBtnText; }
      }
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
