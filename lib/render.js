function esc(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function valueIcon(kind) {
  if (kind === "team") {
    return `<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M8.5 13a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7Zm7 0a3.5 3.5 0 1 1 0-7 3.5 3.5 0 0 1 0 7ZM2.5 19.2c.4-2.7 2.8-4.7 6-4.7s5.6 2 6 4.7a.8.8 0 0 1-.8.8H3.3a.8.8 0 0 1-.8-.8Zm9.7.8h8.5a.8.8 0 0 0 .8-.8c-.3-2-1.7-3.6-3.8-4.3a4.9 4.9 0 0 1-2.7 4.3c-.4.2-.9.5-1.4.6a.8.8 0 0 1-1.4-.6Z"/></svg>`;
  }
  if (kind === "heart") {
    return `<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M12 20.4 10.6 19.1C5.4 14.4 2 11.3 2 7.5A4.5 4.5 0 0 1 6.5 3 5.3 5.3 0 0 1 12 5.1 5.3 5.3 0 0 1 17.5 3 4.5 4.5 0 0 1 22 7.5c0 3.8-3.4 6.9-8.6 11.6L12 20.4Z"/></svg>`;
  }
  return `<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M4 19h2V9H4v10Zm7 0h2V5h-2v14Zm7 0h2v-7h-2v7Z"/></svg>`;
}

function renderPage(content, siteUrl) {
  const origin = String(siteUrl || "https://beauty-flight-plan.apps.grok.bot").replace(/\/$/, "");
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ProfessionalService",
    name: content.brandName,
    description: content.seoDescription,
    telephone: content.phoneTel,
    email: content.email,
    url: `${origin}/`,
    image: `${origin}${content.heroImage}`,
    areaServed: "UA",
    sameAs: [content.instagramUrl, content.telegramUrl].filter(Boolean),
  };

  const heroValues = content.heroValues
    .map(
      (item) => `<li>
        <span class="value-icon">${valueIcon(item.icon)}</span>
        <span>${esc(item.label)}</span>
      </li>`
    )
    .join("");

  const highlights = content.serviceHighlights
    .map(
      (item) => `<article class="highlight-card">
        <div>
          <h3>${esc(item.title)}</h3>
          <p>${esc(item.summary)}</p>
        </div>
        <a class="circle-btn" href="#${esc(item.id)}" aria-label="${esc(item.cta)}: ${esc(item.title)}">
          <span aria-hidden="true">→</span>
        </a>
      </article>`
    )
    .join("");

  const aboutWhy = content.aboutWhy.map((p) => `<p>${esc(p)}</p>`).join("");

  const serviceGroups = content.serviceGroups
    .map((group) => {
      const cards = group.items
        .map((item) => {
          const includes = item.includes.length
            ? `<ul class="check-list">${item.includes.map((point) => `<li>${esc(point)}</li>`).join("")}</ul>`
            : "";
          const note = item.priceNote ? `<p class="price-note">${esc(item.priceNote)}</p>` : "";
          const cta = item.disabled
            ? `<button class="btn btn-line" type="button" disabled>${esc(item.cta)}</button>`
            : `<button class="btn btn-solid" type="button" data-open-form data-intent="${esc(item.intent)}">${esc(item.cta)}</button>`;
          return `<article class="offer-card" id="${esc(item.id)}">
            <h4>${esc(item.title)}</h4>
            <p>${esc(item.summary)}</p>
            ${includes}
            <p class="price">${esc(item.price)}</p>
            ${note}
            ${cta}
          </article>`;
        })
        .join("");
      return `<div class="service-group" id="${esc(group.id)}">
        <div class="group-head">
          <span class="group-num">${esc(group.number)}</span>
          <h3>${esc(group.title)}</h3>
        </div>
        <div class="offer-grid">${cards}</div>
      </div>`;
    })
    .join("");

  const tools = content.tools
    .map((item) => {
      const action = item.disabled
        ? `<button class="btn btn-line" type="button" disabled>${esc(item.cta)}</button>`
        : `<button class="btn btn-solid" type="button" data-open-form data-intent="${esc(item.id)}">${esc(item.cta)}</button>`;
      return `<article class="tool-card" id="${esc(item.id)}">
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.text)}</p>
        ${action}
      </article>`;
    })
    .join("");

  const concepts = content.philosophyConcepts
    .map(
      (item) => `<article class="concept">
        <h3>${esc(item.title)}</h3>
        <p class="concept-sub">${esc(item.subtitle)}</p>
        <p>${esc(item.text)}</p>
      </article>`
    )
    .join("");

  const philosophyIntro = content.philosophyIntro.map((p) => `<p>${esc(p)}</p>`).join("");
  const philosophyManage = content.philosophyManage.map((p) => `<p>${esc(p)}</p>`).join("");

  const reviews = content.reviews
    .map(
      (item) => `<figure class="review-card">
        <img src="${esc(item.image)}" alt="${esc(item.alt)}" loading="lazy" width="540" height="960">
      </figure>`
    )
    .join("");

  const formIntro = content.formIntro.map((p) => `<p>${esc(p)}</p>`).join("");
  const topics = content.formTopics
    .map(
      (topic) => `<label class="check">
        <input type="checkbox" name="topics" value="${esc(topic)}">
        <span>${esc(topic)}</span>
      </label>`
    )
    .join("");

  const consultationDirs = content.consultationPage.directions
    .map((item) => `<li>${esc(item)}</li>`)
    .join("");

  const supportSteps = content.supportPage.steps
    .map(
      (step) => `<li>
        <h4>${esc(step.title)}</h4>
        <p>${esc(step.text)}</p>
      </li>`
    )
    .join("");

  const supportIncludes = content.supportPage.includes
    .map((item) => `<li>${esc(item)}</li>`)
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
  <meta name="theme-color" content="#f4efe6">
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
        <img class="brand-mark" src="/images/stickers/plane.png" alt="" width="36" height="28">
        <span>
          <strong>${esc(content.brandName)}</strong>
          <small>${esc(content.kicker)}</small>
        </span>
      </a>
      <nav class="nav" id="site-nav" aria-label="Розділи">
        <a href="#pro-mene">Про мене</a>
        <a href="#poslugy">Послуги</a>
        <a href="#tools">Beauty Business Tools</a>
        <a href="#filosofiya">Філософія бренду</a>
        <a href="#vidguky">Відгуки</a>
      </nav>
      <button class="btn btn-cta" type="button" data-open-form data-intent="consultation">Записатися на консультацію ↗</button>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
        <span class="bars" aria-hidden="true"></span>
        <span class="visually-hidden">Меню</span>
      </button>
    </div>
  </header>

  <main id="main">
    <section class="hero" id="top">
      <div class="hero-grid">
        <figure class="hero-photo">
          <img src="${esc(content.heroImage)}" alt="${esc(content.heroImageAlt)}" width="853" height="1280">
          <img class="sticker sticker-approved" src="/images/stickers/beauty-approved.png" alt="" width="120" height="120">
        </figure>
        <div class="hero-copy">
          <p class="hero-brand">${esc(content.heroTitle)}</p>
          <h1>${esc(content.heroLead)}</h1>
          <p class="lead">${esc(content.heroText)}</p>
          <ul class="hero-values">${heroValues}</ul>
          <div class="actions">
            <button class="btn btn-solid" type="button" data-open-form data-intent="consultation">Записатися на консультацію</button>
            <a class="btn btn-line" href="#poslugy">Послуги</a>
          </div>
          <div class="hero-stickers" aria-hidden="true">
            <img src="/images/stickers/ne-khaos.png" alt="" width="160" height="70">
            <img src="/images/stickers/pratsyuemo.png" alt="" width="150" height="80">
          </div>
        </div>
      </div>
    </section>

    <section class="section section-soft" id="poslugy-preview">
      <div class="section-head">
        <h2>${esc(content.servicesTitle)}</h2>
        <p>${esc(content.servicesLead)}</p>
      </div>
      <div class="highlight-grid">${highlights}</div>
      <div class="sticker-row" aria-hidden="true">
        <img src="/images/stickers/tags.png" alt="" width="220" height="280">
        <img src="/images/stickers/focus-plan.png" alt="" width="180" height="120">
        <img src="/images/stickers/biznes-servis.png" alt="" width="220" height="80">
      </div>
    </section>

    <section class="section" id="pro-mene">
      <div class="about-grid">
        <div class="about-copy">
          <p class="eyebrow">${esc(content.aboutEyebrow)}</p>
          <h2>${esc(content.aboutTitle)}</h2>
          <p class="lead">${esc(content.aboutLead)}</p>
          <p>${esc(content.aboutInstagramNote)}</p>
          <p><a class="text-link" href="${esc(content.instagramUrl)}" rel="noopener noreferrer" target="_blank">${esc(content.instagramHandle)} · #MyBeautyFlight</a></p>
          <h3>${esc(content.aboutWhyTitle)}</h3>
          ${aboutWhy}
        </div>
        <aside class="about-visual">
          <img src="${esc(content.heroImage)}" alt="${esc(content.heroImageAlt)}" loading="lazy" width="640" height="960">
          <img class="sticker sticker-float" src="/images/stickers/pratsyuemo.png" alt="" width="140" height="80">
        </aside>
      </div>
    </section>

    <section class="section section-soft" id="poslugy">
      <div class="section-head">
        <p class="eyebrow">${esc(content.brandName)}</p>
        <h2>${esc(content.servicesTitle)}</h2>
        <p class="lead">${esc(content.heroLead)}</p>
        <p>${esc(content.servicesIntro)}</p>
      </div>
      ${serviceGroups}
    </section>

    <section class="panel" id="consultatsiya" hidden>
      <div class="panel-inner">
        <button class="panel-close" type="button" data-close-panel aria-label="Закрити">×</button>
        <p class="eyebrow">${esc(content.consultationPage.title)}</p>
        <h2>${esc(content.consultationPage.headline)}</h2>
        <p class="lead">${esc(content.consultationPage.lead)}</p>
        <h3>${esc(content.consultationPage.directionsTitle)}</h3>
        <ul class="check-list">${consultationDirs}</ul>
        <p>${esc(content.consultationPage.note)}</p>
        <p><strong>${esc(content.consultationPage.duration)}</strong></p>
        <p>${esc(content.consultationPage.goal)}</p>
        <button class="btn btn-solid" type="button" data-open-form data-intent="consultation">${esc(content.consultationPage.cta)}</button>
      </div>
    </section>

    <section class="panel" id="suprovid" hidden>
      <div class="panel-inner">
        <button class="panel-close" type="button" data-close-panel aria-label="Закрити">×</button>
        <p class="eyebrow">${esc(content.supportPage.title)}</p>
        <h2>${esc(content.supportPage.headline)}</h2>
        <p class="lead">${esc(content.supportPage.lead)}</p>
        <p>${esc(content.supportPage.lead2)}</p>
        <h3>${esc(content.supportPage.howTitle)}</h3>
        <ol class="support-steps">${supportSteps}</ol>
        <h3>${esc(content.supportPage.includesTitle)}</h3>
        <ul class="check-list">${supportIncludes}</ul>
        <p>${esc(content.supportPage.note)}</p>
        <p><strong>${esc(content.supportPage.duration)}</strong></p>
        <p><strong>${esc(content.supportPage.price)}</strong></p>
        <p>${esc(content.supportPage.goal)}</p>
        <p>${esc(content.supportPage.closing)}</p>
        <button class="btn btn-solid" type="button" data-open-form data-intent="support">${esc(content.supportPage.cta)}</button>
      </div>
    </section>

    <section class="section" id="tools">
      <div class="section-head">
        <h2>${esc(content.toolsTitle)}</h2>
        <p>${esc(content.toolsLead)}</p>
      </div>
      <div class="tools-grid">${tools}</div>
    </section>

    <section class="section section-philosophy" id="filosofiya">
      <div class="section-head">
        <p class="eyebrow">${esc(content.philosophyEyebrow)}</p>
        <h2>${esc(content.philosophyTitle)}</h2>
        <p class="lead">${esc(content.philosophyLead)}</p>
      </div>
      <div class="philosophy-intro">${philosophyIntro}</div>
      <h3 class="concepts-title">${esc(content.philosophyConceptsTitle)}</h3>
      <div class="concepts-grid">${concepts}</div>
      <div class="philosophy-manage">
        <h3>${esc(content.philosophyManageTitle)}</h3>
        ${philosophyManage}
        <p class="closing">${esc(content.philosophyClose)}</p>
        <p class="tagline">${esc(content.philosophyTagline)}</p>
      </div>
    </section>

    <section class="section section-soft" id="vidguky">
      <div class="section-head">
        <h2>${esc(content.reviewsTitle)}</h2>
        <p>${esc(content.reviewsLead)}</p>
      </div>
      <div class="reviews-rail">${reviews}</div>
    </section>

    <section class="cta-band" id="kontakty">
      <div class="cta-inner">
        <h2>${esc(content.ctaTitle)}</h2>
        <p>${esc(content.ctaLead)}</p>
        <div class="actions">
          <button class="btn btn-solid" type="button" data-open-form data-intent="consultation">Записатися на консультацію ↗</button>
          <a class="btn btn-line" href="${esc(content.telegramUrl)}" rel="noopener noreferrer" target="_blank">Написати в Telegram</a>
        </div>
        <ul class="contact-list">
          <li><a href="tel:${esc(content.phoneTel)}">${esc(content.phoneDisplay)}</a> · Telegram</li>
          <li><a href="${esc(content.instagramUrl)}" rel="noopener noreferrer" target="_blank">${esc(content.instagramHandle)}</a></li>
          <li><a href="mailto:${esc(content.email)}">${esc(content.email)}</a></li>
        </ul>
      </div>
    </section>
  </main>

  <div class="modal" id="form-modal" hidden>
    <div class="modal-backdrop" data-close-modal></div>
    <div class="modal-sheet" role="dialog" aria-modal="true" aria-labelledby="form-heading">
      <button class="panel-close" type="button" data-close-modal aria-label="Закрити">×</button>
      <h2 id="form-heading">${esc(content.formTitle)}</h2>
      <div class="form-intro">${formIntro}</div>
      <form id="lead-form">
        <input type="hidden" name="intent" id="form-intent" value="consultation">

        <fieldset>
          <legend>Основна інформація</legend>
          <label>ПІБ<input name="name" required maxlength="80" autocomplete="name"></label>
          <label>Місто<input name="city" required maxlength="80" autocomplete="address-level2"></label>
          <label>Назва салону / студії / простору<input name="businessName" required maxlength="120"></label>
          <label>Посада
            <select name="role" required>
              <option value="">Оберіть</option>
              <option value="власник">Власник</option>
              <option value="керівник">Керівник</option>
              <option value="адміністратор">Адміністратор</option>
              <option value="інше">Інше</option>
            </select>
          </label>
          <label>Telegram або телефон для зв’язку<input name="contact" required maxlength="80" placeholder="@username або +380…"></label>
        </fieldset>

        <fieldset>
          <legend>Про бізнес</legend>
          <label>Скільки років працює ваш бізнес?<input name="years" maxlength="40"></label>
          <label>Скільки людей у команді?<input name="teamSize" maxlength="40"></label>
          <label>Які послуги є основними?<textarea name="mainServices" maxlength="300" rows="2"></textarea></label>
          <label>Скільки клієнтів обслуговуєте в середньому за місяць?<input name="clientsPerMonth" maxlength="80"></label>
        </fieldset>

        <fieldset>
          <legend>Перед консультацією</legend>
          <label>Що зараз найбільше турбує у бізнесі?<textarea name="concerns" maxlength="800" rows="3" required></textarea></label>
          <label>Яким ви бачите свій бізнес через 6 місяців? Яких результатів хотіли б досягти?<textarea name="vision6months" maxlength="800" rows="3" required></textarea></label>
          <label>Що ви вже пробували для вирішення цієї ситуації?<textarea name="triedAlready" maxlength="800" rows="3"></textarea></label>
          <label>Наскільки бізнес залежить від вас? (1–10)
            <input name="dependenceScore" type="number" min="1" max="10" step="1" required>
          </label>
          <label>Чи готові ви впроваджувати зміни, навіть якщо вони потребуватимуть виходу із зони комфорту?
            <select name="readyForChange" required>
              <option value="">Оберіть</option>
              <option value="так">Так</option>
              <option value="скоріше так">Скоріше так</option>
              <option value="ще думаю">Ще думаю</option>
            </select>
          </label>
        </fieldset>

        <fieldset>
          <legend>Що з переліченого актуально зараз?</legend>
          <div class="topic-grid">${topics}</div>
          <label>Інше (якщо обрали)<input name="otherTopic" maxlength="200"></label>
        </fieldset>

        <button class="btn btn-solid" type="submit">Надіслати заявку</button>
        <p class="form-note" id="form-note" role="status"></p>
      </form>
    </div>
  </div>

  <footer class="footer">
    <div class="footer-grid">
      <a class="brand" href="#top">
        <strong>${esc(content.brandName)}</strong>
        <small>${esc(content.kicker)}</small>
      </a>
      <nav aria-label="Футер">
        <a href="#pro-mene">Про мене</a>
        <a href="#poslugy">Послуги</a>
        <a href="#tools">Tools</a>
        <a href="#filosofiya">Філософія</a>
        <a href="#vidguky">Відгуки</a>
      </nav>
      <div class="footer-social">
        <a href="${esc(content.instagramUrl)}" rel="noopener noreferrer" target="_blank">${esc(content.instagramHandle)}</a>
        <a href="${esc(content.telegramUrl)}" rel="noopener noreferrer" target="_blank">Telegram</a>
        <a href="mailto:${esc(content.email)}">Email</a>
      </div>
    </div>
    <p>${esc(content.footerNote)}</p>
  </footer>
  <script src="/js/main.js"></script>
</body>
</html>`;
}

module.exports = { renderPage, esc };
