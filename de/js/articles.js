/* ===================================================================
   ARTICLE LIST — this is the ONLY place you edit to publish an article.
   Newest goes at the TOP.
   Powers BOTH the Insights page (Featured + Archive) AND the homepage
   "Latest thinking" preview (which shows the newest 3 automatically).
   Leave image as "" if the article has no picture — the card still works.
   aiTest: true shows the "AI-generated · Test" label on the card.
   Delete that line once an article is your own reviewed work.
   =================================================================== */
const articles = [
  {
    title: "Der Schock ist zurück: Öl, die Meerenge und die schwierige Wahl der Fed",
    category: "Makro",
    readTime: "6 Min. Lesezeit",
    excerpt: "Der Ölschock von 2026 ist zurück. Brent steigt wieder, weil die Spannungen in der Meerenge zunehmen, und diesmal trifft es eine Federal Reserve mit neuem Vorsitz, während die Märkte eine Zinserhöhung einpreisen. Warum der Folgeeffekt wichtiger ist als die Schlagzeile.",
    url: "/insights/insight-04-strait-fed-dilemma.html",
    aiTest: true,
    image: "/assets/charts/brent-strait-crisis.png"
  },
  {
    title: "Wenn Anleihen sich nicht mehr lohnen: Warum Gold auf Realzinsen reagiert",
    category: "Makro",
    readTime: "6 Min. Lesezeit",
    excerpt: "Gold gehört zu den am meisten missverstandenen Anlagen bei jüngeren Anlegern. Ein verständlicher Blick auf Realzinsen, die Kennzahl, die am besten erklärt, wann Gold gut läuft, und was die Marktgeschichte zeigt.",
    url: "/insights/insight-03-gold-real-yields.html",
    aiTest: true,
    image: "/assets/charts/gold-real-yields.png"
  },
  {
    title: "Warum die Strasse von Hormus wichtiger ist als die OPEC",
    category: "Weltgeschehen",
    readTime: "8 Min. Lesezeit",
    excerpt: "Wer an Öl denkt, schaut auf die OPEC. Doch Engpässe bewegen die Märkte schneller und stärker als jede Förderquote. Von Suez über den Tankerkrieg der 1980er-Jahre bis heute: warum die Strasse von Hormus wichtiger ist.",
    url: "/insights/insight-02-hormuz-vs-opec.html",
    aiTest: true,
    image: "/assets/charts/hormuz-chokepoints.png"
  },
  {
    title: "Der Iran-Konflikt und die globalen Ölmärkte",
    category: "Weltgeschehen",
    readTime: "3 Min. Lesezeit",
    excerpt: "Innerhalb von 72 Stunden nach den gemeinsamen Angriffen der USA und Israels auf Iran kam der Tankerverkehr durch die Strasse von Hormus praktisch zum Erliegen, und Brent-Rohöl erreichte kurzzeitig 120 Dollar. Wir schauen uns an, was die Bewegung antreibt und wie viel davon Fundamentaldaten und wie viel Narrativ ist.",
    url: "/insights/insight-01-iran-oil-markets.html",
    aiTest: true,
    image: "/assets/charts/hormuz-ais.png"
  }
  // To publish a new article, copy a block above, paste it ABOVE the
  // others, and fill in the new details. Keep the comma between entries.
];
