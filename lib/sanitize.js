const IMAGE = /^\/images\/[a-zA-Z0-9._-]+$/;
const INSTAGRAM = /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]+\/?$/;

function text(value, max) {
  return String(value ?? "")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, "")
    .replace(/<[^>]*>/g, "")
    .trim()
    .slice(0, max);
}

function image(value, fallback) {
  const next = text(value, 180);
  return IMAGE.test(next) ? next : fallback;
}

function phoneTel(value, fallback) {
  const next = String(value ?? "").replace(/[^\d+]/g, "").slice(0, 16);
  return /^\+[1-9]\d{8,14}$/.test(next) ? next : fallback;
}

function instagram(value, fallback) {
  const next = text(value, 120).replace(/\/+$/, "");
  return INSTAGRAM.test(next) ? next : fallback;
}

function lines(value, fallback, maxItems, maxLen) {
  const source = Array.isArray(value) ? value : fallback;
  const clean = source.map((item) => text(item, maxLen)).filter(Boolean).slice(0, maxItems);
  return clean.length ? clean : fallback;
}

function points(value, fallback) {
  return lines(value, fallback, 8, 180);
}

function sanitize(input, defaults) {
  const src = input && typeof input === "object" ? input : {};
  const base = defaults;
  const services = Array.isArray(src.services) && src.services.length
    ? src.services.slice(0, 12).map((item, index) => {
        const fallback = base.services[index] || base.services[0];
        const id = text(item.id, 40).toLowerCase().replace(/[^a-z0-9-]/g, "") || fallback.id;
        return {
          id,
          title: text(item.title, 80) || fallback.title,
          summary: text(item.summary, 220) || fallback.summary,
          text: text(item.text, 700) || fallback.text,
          points: points(item.points, fallback.points),
          image: image(item.image, fallback.image),
          imageAlt: text(item.imageAlt, 180) || fallback.imageAlt,
        };
      })
    : base.services;

  const steps = Array.isArray(src.steps) && src.steps.length
    ? src.steps.slice(0, 6).map((item, index) => {
        const fallback = base.steps[index] || base.steps[0];
        return {
          title: text(item.title, 80) || fallback.title,
          text: text(item.text, 300) || fallback.text,
        };
      })
    : base.steps;

  const extras = Array.isArray(src.extras) && src.extras.length
    ? src.extras.slice(0, 8).map((item, index) => {
        const fallback = base.extras[index] || base.extras[0];
        return {
          title: text(item.title, 80) || fallback.title,
          text: text(item.text, 400) || fallback.text,
          image: image(item.image, fallback.image),
          imageAlt: text(item.imageAlt, 180) || fallback.imageAlt,
        };
      })
    : base.extras;

  const gallery = Array.isArray(src.gallery) && src.gallery.length
    ? src.gallery.slice(0, 12).map((item, index) => {
        const fallback = base.gallery[index] || base.gallery[0];
        return {
          image: image(item.image, fallback.image),
          alt: text(item.alt, 180) || fallback.alt,
        };
      })
    : base.gallery;

  const faq = Array.isArray(src.faq) && src.faq.length
    ? src.faq.slice(0, 12).map((item, index) => {
        const fallback = base.faq[index] || { q: "Питання", a: "Відповідь" };
        return {
          q: text(item.q, 160) || fallback.q,
          a: text(item.a, 500) || fallback.a,
        };
      })
    : base.faq;

  const stats = Array.isArray(src.stats) && src.stats.length
    ? src.stats.slice(0, 4).map((item, index) => {
        const fallback = base.stats[index] || base.stats[0];
        return {
          value: text(item.value, 16) || fallback.value,
          label: text(item.label, 40) || fallback.label,
        };
      })
    : base.stats;

  return {
    seoTitle: text(src.seoTitle, 120) || base.seoTitle,
    seoDescription: text(src.seoDescription, 280) || base.seoDescription,
    brandName: text(src.brandName, 40) || base.brandName,
    kicker: text(src.kicker, 40) || base.kicker,
    phoneDisplay: text(src.phoneDisplay, 32) || base.phoneDisplay,
    phoneTel: phoneTel(src.phoneTel, base.phoneTel),
    addressLines: lines(src.addressLines, base.addressLines, 4, 80),
    mapQuery: text(src.mapQuery, 120) || base.mapQuery,
    instagramUrl: instagram(src.instagramUrl, base.instagramUrl),
    instagramHandle: text(src.instagramHandle, 40) || base.instagramHandle,
    heroEyebrow: text(src.heroEyebrow, 80) || base.heroEyebrow,
    heroTitle: text(src.heroTitle, 120) || base.heroTitle,
    heroLead: text(src.heroLead, 200) || base.heroLead,
    heroText: text(src.heroText, 400) || base.heroText,
    heroImage: image(src.heroImage, base.heroImage),
    heroImageAlt: text(src.heroImageAlt, 180) || base.heroImageAlt,
    audiences: lines(src.audiences, base.audiences, 8, 40),
    stats,
    servicesTitle: text(src.servicesTitle, 80) || base.servicesTitle,
    servicesLead: text(src.servicesLead, 240) || base.servicesLead,
    services,
    stepsTitle: text(src.stepsTitle, 80) || base.stepsTitle,
    stepsLead: text(src.stepsLead, 240) || base.stepsLead,
    steps,
    extrasTitle: text(src.extrasTitle, 80) || base.extrasTitle,
    extrasLead: text(src.extrasLead, 240) || base.extrasLead,
    extras,
    galleryTitle: text(src.galleryTitle, 80) || base.galleryTitle,
    galleryLead: text(src.galleryLead, 240) || base.galleryLead,
    gallery,
    faqTitle: text(src.faqTitle, 80) || base.faqTitle,
    faq,
    formTitle: text(src.formTitle, 80) || base.formTitle,
    formText: text(src.formText, 300) || base.formText,
    footerNote: text(src.footerNote, 120) || base.footerNote,
  };
}

function leadInput(body) {
  const name = text(body.name, 80);
  const phone = text(body.phone, 32);
  const digits = phone.replace(/\D/g, "");
  if (name.length < 2 || digits.length < 10 || digits.length > 15) return null;
  return {
    name,
    phone,
    eventType: text(body.eventType, 80),
    eventDate: text(body.eventDate, 40),
    guests: text(body.guests, 20),
    message: text(body.message, 1000),
  };
}

module.exports = { sanitize, leadInput };
