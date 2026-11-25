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
  const origin = String(siteUrl || "https://schastia.apps.grok.bot").replace(/\/$/, "");
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

  const highlightIcon = (id) => {
    if (id === "suprovid") {
      return `<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M12 3 3 7.5 12 12l9-4.5L12 3Zm-7.5 8.2v3.3L12 19l7.5-4.5v-3.3L12 16.5 4.5 11.2Z"/></svg>`;
    }
    return `<svg viewBox="0 0 24 24" width="28" height="28" aria-hidden="true"><path fill="currentColor" d="M4 4h16v12H7.2L4 19.2V4Zm3 4v2h10V8H7Zm0 4v2h7v-2H7Z"/></svg>`;
  };

  const highlights = content.serviceHighlights
    .map(
      (item) => `<article class="highlight-card">
        <span class="highlight-icon">${highlightIcon(item.id)}</span>
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

  const toolIcon = (id) => {
    if (id === "tool-channel") {
      return `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M3 11.5 21 3l-3.2 18-5.6-4.8-3.4 3.2.1-5.7L3 11.5Z"/></svg>`;
    }
    if (id === "tool-form") {
      return `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M5 3h14v18H5V3Zm3 4v2h8V7H8Zm0 4v2h8v-2H8Zm0 4v2h5v-2H8Z"/></svg>`;
    }
    return `<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><path fill="currentColor" d="M6 3h12v18l-6-3-6 3V3Zm3 4v2h6V7H9Zm0 4v2h6v-2H9Z"/></svg>`;
  };

  const featuredTools = content.tools.slice(0, 3)
    .map((item) => {
      const action = item.disabled
        ? `<button class="circle-btn" type="button" disabled aria-label="${esc(item.cta)}"><span aria-hidden="true">↓</span></button>`
        : item.id === "tool-form"
          ? `<button class="circle-btn" type="button" data-open-form data-intent="consultation" aria-label="${esc(item.cta)}"><span aria-hidden="true">→</span></button>`
          : `<button class="circle-btn" type="button" data-open-form data-intent="${esc(item.id)}" aria-label="${esc(item.cta)}"><span aria-hidden="true">↗</span></button>`;
      return `<article class="tool-feature" id="${esc(item.id)}">
        <span class="highlight-icon">${toolIcon(item.id)}</span>
        <h3>${esc(item.title)}</h3>
        <p>${esc(item.text)}</p>
        ${action}
      </article>`;
    })
    .join("");

  const tools = content.tools.slice(3)
    .map((item) => {
      const action = item.disabled
        ? `<button class="btn btn-line" type="button" disabled>${esc(item.cta)}</button>`
        : `<button class="btn btn-solid" type="button" data-open-form data-intent="${esc(item.id)}">${esc(item.cta)}</button>`;
      return `<article class="tool-card">
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
  <meta name="theme-color" content="#171210">
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
        <span class="brand-mark" aria-hidden="true">
          <svg viewBox="0 0 80 36" width="48" height="22"><path d="M8 24 L36 19 L68 9 L72 11.5 L46 19.5 L70 24 L66 26.5 L42 22.5 L30 23.5 L14 28 L10 26 L16 23.5 Z" fill="currentColor"/><path d="M50 14c8-2 16-4 24-5.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="1.2 2.6" stroke-linecap="round" opacity=".75"/></svg>
        </span>
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
        <button class="btn btn-cta nav-cta-mobile" type="button" data-open-form data-intent="consultation">Записатися на консультацію ↗</button>
      </nav>
      <button class="btn btn-cta nav-cta-desktop" type="button" data-open-form data-intent="consultation">Записатися на консультацію ↗</button>
      <button class="nav-toggle" type="button" aria-expanded="false" aria-controls="site-nav">
        <span class="bars" aria-hidden="true"></span>
        <span class="visually-hidden">Меню</span>
      </button>
    </div>
  </header>

  <main id="main">
    <section class="hero" id="top">
      <svg class="flight-arc flight-arc-left" viewBox="0 0 120 520" aria-hidden="true" focusable="false">
        <path d="M90 20C20 140 20 260 70 360c30 60 40 100 20 140" fill="none" stroke="currentColor" stroke-width="1.6"/>
      </svg>
      <svg class="flight-arc flight-arc-right" viewBox="0 0 120 520" aria-hidden="true" focusable="false">
        <path d="M30 40c70 110 80 220 40 330-20 55-10 100 20 140" fill="none" stroke="currentColor" stroke-width="1.6"/>
      </svg>
      <div class="hero-grid">
        <figure class="hero-photo">
          <img src="${esc(content.heroImage)}" alt="${esc(content.heroImageAlt)}" width="853" height="1280">
          <img class="sticker sticker-approved" src="/images/stickers/beauty-approved.png" alt="" width="110" height="110">
        </figure>
        <div class="hero-copy">
          <p class="hero-brand">
            <span class="hero-brand-text">${esc(content.heroTitle)}</span>
            <span class="flight-mark" aria-hidden="true">
              <svg viewBox="0 0 80 36" width="58" height="26"><path d="M8 24 L36 19 L68 9 L72 11.5 L46 19.5 L70 24 L66 26.5 L42 22.5 L30 23.5 L14 28 L10 26 L16 23.5 Z" fill="currentColor"/><path d="M50 14c8-2 16-4 24-5.5" fill="none" stroke="currentColor" stroke-width="1.5" stroke-dasharray="1.2 2.6" stroke-linecap="round" opacity=".9"/></svg>
            </span>
          </p>
          <h1>${esc(content.heroLead)}</h1>
          <p class="lead">${esc(content.heroText)}</p>
          <ul class="hero-values">${heroValues}</ul>
        </div>
      </div>
    </section>

    <section class="section section-soft" id="poslugy-preview">
      <div class="section-head section-head-row">
        <h2>${esc(content.servicesTitle)}</h2>
        <p>${esc(content.servicesLead)}</p>
      </div>
      <div class="highlight-grid">${highlights}</div>
    </section>

    <section class="section" id="pro-mene">
      <div class="about-grid">
        <aside class="about-visual">
          <img src="/images/brand/about-cabin.jpg" alt="Робоче місце в кабіні літака з логотипом THE BEAUTY FLIGHT PLAN" loading="lazy" width="640" height="800">
          <img class="sticker sticker-float" src="/images/stickers/ne-khaos.png" alt="" width="150" height="70">
        </aside>
        <div class="about-copy">
          <p class="eyebrow">${esc(content.aboutEyebrow)}</p>
          <h2>${esc(content.aboutTitle)}</h2>
          <p class="lead">${esc(content.aboutLead)}</p>
          <p>${esc(content.aboutInstagramNote)}</p>
          <p><a class="text-link" href="${esc(content.instagramUrl)}" rel="noopener noreferrer" target="_blank">${esc(content.instagramHandle)} · #MyBeautyFlight</a></p>
          <h3>${esc(content.aboutWhyTitle)}</h3>
          ${aboutWhy}
        </div>
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

    <section class="section section-soft" id="tools">
      <div class="section-head">
        <h2>${esc(content.toolsTitle)}</h2>
        <p>${esc(content.toolsLead)}</p>
      </div>
      <div class="tools-feature-grid">${featuredTools}</div>
      ${tools ? `<div class="tools-grid">${tools}</div>` : ""}
      <div class="sticker-row" aria-hidden="true">
        <img src="/images/stickers/tags.png" alt="" width="200" height="260">
        <img src="/images/stickers/focus-plan.png" alt="" width="170" height="110">
        <img src="/images/stickers/biznes-servis.png" alt="" width="210" height="70">
        <img src="/images/stickers/pratsyuemo.png" alt="" width="150" height="80">
      </div>
    </section>

    <section class="section section-philosophy" id="filosofiya">
      <div class="philosophy-layout">
        <figure class="philosophy-window">
          <img src="/images/brand/philosophy-wing.jpg" alt="Крило літака над хмарами на заході сонця" loading="lazy" width="640" height="800">
        </figure>
        <div class="philosophy-copy">
          <p class="eyebrow">${esc(content.philosophyEyebrow)}</p>
          <h2>${esc(content.philosophyTitle)}</h2>
          <p class="lead">${esc(content.philosophyLead)}</p>
          <div class="philosophy-intro">${philosophyIntro}</div>
          <aside class="philosophy-note">
            The Beauty Flight Plan — це твій маршрут до системної, професійної та комфортної роботи в beauty-індустрії.
          </aside>
        </div>
      </div>
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

    <section class="cta-band" id="kontakty" style="--cta-image:url('/images/brand/cta-runway.jpg')">
      <div class="cta-inner">
        <h2>${esc(content.ctaTitle)}</h2>
        <p>${esc(content.ctaLead)}</p>
        <div class="actions">
          <button class="btn btn-cream" type="button" data-open-form data-intent="consultation">Записатися на консультацію ↗</button>
          <a class="btn btn-ghost" href="${esc(content.instagramUrl)}" rel="noopener noreferrer" target="_blank">Instagram</a>
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
