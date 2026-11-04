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
      if (btn) { btn.disabled = true; btn.textContent = "Wird gesendet..."; }

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
            note.textContent = "Danke. Deine Nachricht ist angekommen, wir antworten innerhalb von 1–2 Arbeitstagen.";
            form.reset();
          } else {
            note.style.color = "#B3261E";
            note.textContent = "Beim Senden ist etwas schiefgelaufen. Bitte schreib uns direkt an info@suravacapital.ch.";
          }
        }
      } catch (err) {
        if (note) {
          note.style.display = "block";
          note.style.color = "#B3261E";
          note.textContent = "Beim Senden ist etwas schiefgelaufen. Bitte schreib uns direkt an info@suravacapital.ch.";
        }
      } finally {
        if (btn) { btn.disabled = false; btn.textContent = originalBtnText; }
      }
    });
  }

  // Highlight current nav link
  // Menu links point to section folders (/markets/, /education/ ...); highlight the section you are in, guides included
  const path = window.location.pathname.replace(/index\.html$/, "");
  document.querySelectorAll(".nav-links > a, .has-dropdown > a").forEach((a) => {
    const href = (a.getAttribute("href") || "").split("#")[0];
    if (href.length > 1 && href.endsWith("/de/") && path.startsWith(href)) {
      a.style.color = "var(--color-accent-dark)";
    }
  });
});

// ===== Whole cards are clickable (image, title, text), not only their "Read more" link =====
(function () {
  var CARD_SEL = '.card, .article-card, .focus-card, #featured-article';

  function primaryLink(card) {
    if (card.tagName === 'A') return null;            // already a link
    var main = card.querySelector('a.card-link[href]');
    if (main) return main;
    var hrefs = {}, first = null;
    card.querySelectorAll('a[href]').forEach(function (a) {
      var h = a.getAttribute('href');
      if (!h || h === '#') return;
      if (!first) first = a;
      hrefs[h] = true;
    });
    return Object.keys(hrefs).length === 1 ? first : null;
  }

  function mark() {
    document.querySelectorAll(CARD_SEL).forEach(function (card) {
      card.classList.toggle('is-clickable', !!primaryLink(card));
    });
  }

  document.addEventListener('click', function (e) {
    if (e.defaultPrevented || e.button !== 0) return;
    var card = e.target.closest(CARD_SEL);
    if (!card || !card.classList.contains('is-clickable')) return;
    if (e.target.closest('a, button, input, select, textarea, label')) return;  // real controls keep working
    if (String(window.getSelection ? window.getSelection() : '').length) return; // let people select text
    var link = primaryLink(card);
    if (!link) return;
    if (e.metaKey || e.ctrlKey) window.open(link.href, '_blank', 'noopener');
    else link.click();
  });

  document.addEventListener('DOMContentLoaded', function () {
    mark();
    // cards filled in later by JS (Insights archive, focus archive) get marked too
    new MutationObserver(function () { mark(); }).observe(document.body, { childList: true, subtree: true });
  });
})();

// ===== Language switch: the dark pill slides across, then the other language loads =====
(function () {
  var sw = document.querySelector('.lang-switch');
  if (!sw) return;
  var here = sw.getAttribute('data-lang'), SLIDE = 240;
  function show(lang) {
    sw.setAttribute('data-lang', lang);
    sw.querySelectorAll('a').forEach(function (a) {
      a.classList.toggle('is-active', a.getAttribute('hreflang') === lang);
    });
  }
  sw.addEventListener('click', function (e) {
    var a = e.target.closest('a');
    if (!a || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    var lang = a.getAttribute('hreflang');
    if (lang === here) { e.preventDefault(); return; }
    if (window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    e.preventDefault();
    show(lang);
    setTimeout(function () { window.location.href = a.href; }, SLIDE);
  });
  // Back button: the browser may restore this page as it was left, so put the pill back
  window.addEventListener('pageshow', function (e) { if (e.persisted) show(here); });
})();
