function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function renderPage(content, siteUrl) {
  const origin = String(siteUrl || "https://schastia.apps.grok.bot").replace(/\/$/, "");
  const map = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(content.mapQuery)}`;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FoodService",
    name: content.brandName,
    description: content.seoDescription,
    telephone: content.phoneTel,
    url: `${origin}/`,
    image: `${origin}${content.heroImage}`,
    servesCuisine: "Catering",
    address: {
      "@type": "PostalAddress",
      streetAddress: content.addressLines[content.addressLines.length - 1],
      addressLocality: "Вінниця",
      addressCountry: "UA",
    },
    areaServed: "Україна",
    sameAs: [content.instagramUrl],
  };

  const nav = content.services
    .map((service) => `<a href="#${esc(service.id)}">${esc(service.title)}</a>`)
    .join("");

  const audiences = content.audiences.map((item) => `<li>${esc(item)}</li>`).join("");
  const stats = content.stats
    .map((item) => `<li><strong>${esc(item.value)}</strong><span>${esc(item.label)}</span></li>`)
    .join("");

  const cards = content.services
    .map(
      (service) => `<article class="service" id="${esc(service.id)}">
        <img src="${esc(service.image)}" alt="${esc(service.imageAlt)}" width="640" height="480" loading="lazy">
        <div>
          <h3>${esc(service.title)}</h3>
          <p class="summary">${esc(service.summary)}</p>
          <p>${esc(service.text)}</p>
          <ul>${service.points.map((point) => `<li>${esc(point)}</li>`).join("")}</ul>
        </div>
      </article>`
    )
    .join("");

  const steps = content.steps
    .map(
      (step, index) => `<li>
        <span>${index + 1}</span>
        <h3>${esc(step.title)}</h3>
        <p>${esc(step.text)}</p>
      </li>`
    )
    .join("");

  const extras = content.extras
    .map(
      (item) => `<article>
        <img src="${esc(item.image)}" alt="${esc(item.imageAlt)}" width="640" height="420" loading="lazy">
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.text)}</p>
      </article>`
    )
    .join("");

  const gallery = content.gallery
    .map((item) => `<figure><img src="${esc(item.image)}" alt="${esc(item.alt)}" loading="lazy"></figure>`)
    .join("");

  const faq = content.faq
    .map(
      (item) => `<details>
        <summary>${esc(item.q)}</summary>
        <p>${esc(item.a)}</p>
      </details>`
    )
    .join("");

  const eventOptions = content.services
    .map((service) => `<option value="${esc(service.title)}">${esc(service.title)}</option>`)
    .join("");

  return `<!DOCTYPE html>
<html lang="uk">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${esc(content.seoTitle)}</title>
  <meta name="description" content="${esc(content.seoDescription)}">
  <link rel="canonical" href="${esc(origin)}/">
  <meta name="robots" content="index, follow">
  <meta name="theme-color" content="#1a1612">
  <meta property="og:type" content="website">
  <meta property="og:locale" content="uk_UA">
  <meta property="og:title" content="${esc(content.seoTitle)}">
  <meta property="og:description" content="${esc(content.seoDescription)}">
  <meta property="og:url" content="${esc(origin)}/">
  <meta property="og:image" content="${esc(origin + content.heroImage)}">
  <meta property="og:image:alt" content="${esc(content.heroImageAlt)}">
  <link rel="icon" href="/favicon.svg" type="image/svg+xml">
  <link rel="preload" as="image" href="${esc(content.heroImage)}">
  <link rel="stylesheet" href="/css/styles.css">
  <script type="application/ld+json">${JSON.stringify(jsonLd).replace(/</g, "\\u003c")}</script>
</head>
<body>
  <a class="skip" href="#main">До змісту</a>
  <header class="header">
    <div class="bar">
      <a class="brand" href="#top">
        <span>${esc(content.brandName)}</span>
        <small>${esc(content.kicker)}</small>
      </a>
      <nav class="nav" id="site-nav" aria-label="Розділи">
        <a href="#poslugy">Послуги</a>
        <a href="#yak">Як це працює</a>
        <a href="#dodatkovo">Додатково</a>
        <a href="#galereya">Галерея</a>
        <a href="#pytannya">Питання</a>
        <a href="#kontakty">Контакти</a>
      </nav>
      <a class="phone" href="tel:${esc(content.phoneTel)}">${esc(content.phoneDisplay)}</a>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
        <span class="bars" aria-hidden="true"></span>
        <span class="visually-hidden">Меню</span>
      </button>
    </div>
  </header>

  <main id="main">
    <section class="hero" id="top">
      <div class="hero-copy">
        <p class="eyebrow">${esc(content.heroEyebrow)}</p>
        <h1>${esc(content.heroTitle)}</h1>
        <p class="lead">${esc(content.heroLead)}</p>
        <p>${esc(content.heroText)}</p>
        <ul class="audiences">${audiences}</ul>
        <div class="actions">
          <a class="btn btn-solid" href="#kontakty">Залишити заявку</a>
          <a class="btn btn-line" href="tel:${esc(content.phoneTel)}">Зателефонувати</a>
        </div>
      </div>
      <figure class="hero-photo">
        <img src="${esc(content.heroImage)}" alt="${esc(content.heroImageAlt)}" width="1280" height="960">
      </figure>
    </section>

    <ul class="stats">${stats}</ul>

    <section class="section" id="poslugy">
      <div class="section-head">
        <h2>${esc(content.servicesTitle)}</h2>
        <p>${esc(content.servicesLead)}</p>
      </div>
      <div class="service-nav" aria-label="Швидкий перехід">${nav}</div>
      <div class="services">${cards}</div>
    </section>

    <section class="section section-ink" id="yak">
      <div class="section-head">
        <h2>${esc(content.stepsTitle)}</h2>
        <p>${esc(content.stepsLead)}</p>
      </div>
      <ol class="steps">${steps}</ol>
    </section>

    <section class="section" id="dodatkovo">
      <div class="section-head">
        <h2>${esc(content.extrasTitle)}</h2>
        <p>${esc(content.extrasLead)}</p>
      </div>
      <div class="extras">${extras}</div>
    </section>

    <section class="section section-tight" id="galereya">
      <div class="section-head">
        <h2>${esc(content.galleryTitle)}</h2>
        <p>${esc(content.galleryLead)}</p>
      </div>
      <div class="gallery">${gallery}</div>
    </section>

    <section class="section" id="pytannya">
      <div class="section-head">
        <h2>${esc(content.faqTitle)}</h2>
      </div>
      <div class="faq">${faq}</div>
    </section>

    <section class="section contact" id="kontakty">
      <div class="contact-card">
        <h2>${esc(content.formTitle)}</h2>
        <p>${esc(content.formText)}</p>
        <form id="lead-form">
          <label>Ім’я<input name="name" required maxlength="80" autocomplete="name"></label>
          <label>Телефон<input name="phone" required maxlength="32" autocomplete="tel" placeholder="ваш номер"></label>
          <label>Формат
            <select name="eventType">
              <option value="">Оберіть</option>
              ${eventOptions}
            </select>
          </label>
          <div class="pair">
            <label>Дата<input name="eventDate" maxlength="40" placeholder="наприклад, 20 червня"></label>
            <label>Гостей<input name="guests" maxlength="20" inputmode="numeric"></label>
          </div>
          <label>Коментар<textarea name="message" maxlength="1000" rows="4"></textarea></label>
          <button class="btn btn-solid" type="submit">Надіслати</button>
          <p class="form-note" id="form-note" role="status"></p>
        </form>
      </div>
      <aside class="contact-aside">
        <h2>Контакти</h2>
        <a class="big-phone" href="tel:${esc(content.phoneTel)}">${esc(content.phoneDisplay)}</a>
        <address>${content.addressLines.map((line) => esc(line)).join("<br>")}</address>
        <a class="text-link" href="${esc(map)}">Відкрити карту</a>
        <a class="text-link" href="${esc(content.instagramUrl)}">${esc(content.instagramHandle)}</a>
        <img class="qr" src="/images/instagram-qr.svg" alt="QR-код Instagram ${esc(content.instagramHandle)}" width="148" height="148">
      </aside>
    </section>
  </main>

  <a class="callbar" href="tel:${esc(content.phoneTel)}">Зателефонувати · ${esc(content.phoneDisplay)}</a>
  <footer class="footer">
    <p>${esc(content.footerNote)}</p>
    <p><a href="tel:${esc(content.phoneTel)}">${esc(content.phoneDisplay)}</a></p>
  </footer>
  <script src="/js/main.js"></script>
</body>
</html>`;
}

module.exports = { renderPage, esc };
