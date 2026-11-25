const IMAGE = /^\/images\/[a-zA-Z0-9._\/-]+$/;
const INSTAGRAM = /^https:\/\/(www\.)?instagram\.com\/[A-Za-z0-9._]+\/?$/;
const TELEGRAM = /^https:\/\/t\.me\/[A-Za-z0-9_+.-]+\/?$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

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

function telegram(value, fallback) {
  const next = text(value, 120).replace(/\/+$/, "");
  return TELEGRAM.test(next) ? next : fallback;
}

function email(value, fallback) {
  const next = text(value, 120);
  return EMAIL.test(next) ? next : fallback;
}

function lines(value, fallback, maxItems, maxLen) {
  const source = Array.isArray(value) ? value : fallback;
  const clean = source.map((item) => text(item, maxLen)).filter(Boolean).slice(0, maxItems);
  return clean.length ? clean : fallback;
}

function bool(value, fallback) {
  return typeof value === "boolean" ? value : Boolean(fallback);
}

function sanitize(input, defaults) {
  const src = input && typeof input === "object" ? input : {};
  const base = defaults;

  const heroValues =
    Array.isArray(src.heroValues) && src.heroValues.length
      ? src.heroValues.slice(0, 4).map((item, index) => {
          const fallback = base.heroValues[index] || base.heroValues[0];
          return {
            label: text(item.label, 60) || fallback.label,
            icon: text(item.icon, 20) || fallback.icon,
          };
        })
      : base.heroValues;

  const serviceHighlights =
    Array.isArray(src.serviceHighlights) && src.serviceHighlights.length
      ? src.serviceHighlights.slice(0, 4).map((item, index) => {
          const fallback = base.serviceHighlights[index] || base.serviceHighlights[0];
          return {
            id: text(item.id, 40).toLowerCase().replace(/[^a-z0-9-]/g, "") || fallback.id,
            title: text(item.title, 80) || fallback.title,
            summary: text(item.summary, 240) || fallback.summary,
            cta: text(item.cta, 60) || fallback.cta,
          };
        })
      : base.serviceHighlights;

  const serviceGroups =
    Array.isArray(src.serviceGroups) && src.serviceGroups.length
      ? src.serviceGroups.slice(0, 6).map((group, gIndex) => {
          const gFallback = base.serviceGroups[gIndex] || base.serviceGroups[0];
          const items =
            Array.isArray(group.items) && group.items.length
              ? group.items.slice(0, 8).map((item, iIndex) => {
                  const fallback = (gFallback.items && gFallback.items[iIndex]) || gFallback.items[0];
                  return {
                    id: text(item.id, 40).toLowerCase().replace(/[^a-z0-9-]/g, "") || fallback.id,
                    title: text(item.title, 100) || fallback.title,
                    summary: text(item.summary, 500) || fallback.summary,
                    includes: lines(item.includes, fallback.includes || [], 12, 220),
                    price: text(item.price, 80) || fallback.price,
                    priceNote: text(item.priceNote, 200) || fallback.priceNote || "",
                    cta: text(item.cta, 80) || fallback.cta,
                    intent: text(item.intent, 40) || fallback.intent,
                    disabled: bool(item.disabled, fallback.disabled),
                  };
                })
              : gFallback.items;
          return {
            id: text(group.id, 40).toLowerCase().replace(/[^a-z0-9-]/g, "") || gFallback.id,
            number: text(group.number, 8) || gFallback.number,
            title: text(group.title, 100) || gFallback.title,
            items,
          };
        })
      : base.serviceGroups;

  const tools =
    Array.isArray(src.tools) && src.tools.length
      ? src.tools.slice(0, 8).map((item, index) => {
          const fallback = base.tools[index] || base.tools[0];
          return {
            id: text(item.id, 40).toLowerCase().replace(/[^a-z0-9-]/g, "") || fallback.id,
            title: text(item.title, 80) || fallback.title,
            text: text(item.text, 240) || fallback.text,
            cta: text(item.cta, 60) || fallback.cta,
            arrow: text(item.arrow, 4) || fallback.arrow || "→",
            disabled: bool(item.disabled, fallback.disabled),
          };
        })
      : base.tools;

  const philosophySenses =
    Array.isArray(src.philosophySenses) && src.philosophySenses.length
      ? src.philosophySenses.slice(0, 6).map((item, index) => {
          const fallback = (base.philosophySenses && base.philosophySenses[index]) || {
            icon: "plane",
            word: "Flight",
            text: "",
          };
          return {
            icon: text(item.icon, 20) || fallback.icon,
            word: text(item.word, 40) || fallback.word,
            text: text(item.text, 220) || fallback.text,
          };
        })
      : base.philosophySenses || [];

  const philosophyConcepts =
    Array.isArray(src.philosophyConcepts) && src.philosophyConcepts.length
      ? src.philosophyConcepts.slice(0, 10).map((item, index) => {
          const fallback = base.philosophyConcepts[index] || base.philosophyConcepts[0];
          return {
            title: text(item.title, 60) || fallback.title,
            subtitle: text(item.subtitle, 100) || fallback.subtitle,
            text: text(item.text, 500) || fallback.text,
          };
        })
      : base.philosophyConcepts;

  const reviews =
    Array.isArray(src.reviews) && src.reviews.length
      ? src.reviews.slice(0, 16).map((item, index) => {
          const fallback = base.reviews[index] || base.reviews[0];
          return {
            image: image(item.image, fallback.image),
            alt: text(item.alt, 180) || fallback.alt,
          };
        })
      : base.reviews;

  const consultationPage = {
    ...base.consultationPage,
    ...(src.consultationPage && typeof src.consultationPage === "object" ? {
      title: text(src.consultationPage.title, 80) || base.consultationPage.title,
      headline: text(src.consultationPage.headline, 120) || base.consultationPage.headline,
      lead: text(src.consultationPage.lead, 600) || base.consultationPage.lead,
      directionsTitle: text(src.consultationPage.directionsTitle, 120) || base.consultationPage.directionsTitle,
      directions: lines(src.consultationPage.directions, base.consultationPage.directions, 10, 80),
      note: text(src.consultationPage.note, 400) || base.consultationPage.note,
      duration: text(src.consultationPage.duration, 80) || base.consultationPage.duration,
      goal: text(src.consultationPage.goal, 400) || base.consultationPage.goal,
      cta: text(src.consultationPage.cta, 80) || base.consultationPage.cta,
    } : {}),
  };

  const supportPageSrc = src.supportPage && typeof src.supportPage === "object" ? src.supportPage : {};
  const supportSteps =
    Array.isArray(supportPageSrc.steps) && supportPageSrc.steps.length
      ? supportPageSrc.steps.slice(0, 6).map((item, index) => {
          const fallback = base.supportPage.steps[index] || base.supportPage.steps[0];
          return {
            title: text(item.title, 100) || fallback.title,
            text: text(item.text, 500) || fallback.text,
          };
        })
      : base.supportPage.steps;

  const supportPage = {
    ...base.supportPage,
    title: text(supportPageSrc.title, 80) || base.supportPage.title,
    headline: text(supportPageSrc.headline, 120) || base.supportPage.headline,
    lead: text(supportPageSrc.lead, 600) || base.supportPage.lead,
    lead2: text(supportPageSrc.lead2, 500) || base.supportPage.lead2,
    howTitle: text(supportPageSrc.howTitle, 100) || base.supportPage.howTitle,
    steps: supportSteps,
    includesTitle: text(supportPageSrc.includesTitle, 100) || base.supportPage.includesTitle,
    includes: lines(supportPageSrc.includes, base.supportPage.includes, 14, 220),
    note: text(supportPageSrc.note, 300) || base.supportPage.note,
    duration: text(supportPageSrc.duration, 80) || base.supportPage.duration,
    price: text(supportPageSrc.price, 160) || base.supportPage.price,
    goal: text(supportPageSrc.goal, 400) || base.supportPage.goal,
    closing: text(supportPageSrc.closing, 400) || base.supportPage.closing,
    cta: text(supportPageSrc.cta, 80) || base.supportPage.cta,
  };

  return {
    seoTitle: text(src.seoTitle, 140) || base.seoTitle,
    seoDescription: text(src.seoDescription, 300) || base.seoDescription,
    brandName: text(src.brandName, 60) || base.brandName,
    kicker: text(src.kicker, 60) || base.kicker,
    phoneDisplay: text(src.phoneDisplay, 32) || base.phoneDisplay,
    phoneTel: phoneTel(src.phoneTel, base.phoneTel),
    telegramUrl: telegram(src.telegramUrl, base.telegramUrl),
    telegramHandle: text(src.telegramHandle, 40) || base.telegramHandle,
    email: email(src.email, base.email),
    instagramUrl: instagram(src.instagramUrl, base.instagramUrl),
    instagramHandle: text(src.instagramHandle, 40) || base.instagramHandle,
    heroTitle: text(src.heroTitle, 80) || base.heroTitle,
    heroLead: text(src.heroLead, 200) || base.heroLead,
    heroText: text(src.heroText, 300) || base.heroText,
    heroImage: image(src.heroImage, base.heroImage),
    heroImageAlt: text(src.heroImageAlt, 180) || base.heroImageAlt,
    heroValues,
    aboutTitle: text(src.aboutTitle, 80) || base.aboutTitle,
    aboutEyebrow: text(src.aboutEyebrow, 120) || base.aboutEyebrow,
    aboutLead: text(src.aboutLead, 500) || base.aboutLead,
    aboutInstagramNote: text(src.aboutInstagramNote, 500) || base.aboutInstagramNote,
    aboutWhyTitle: text(src.aboutWhyTitle, 160) || base.aboutWhyTitle,
    aboutWhy: lines(src.aboutWhy, base.aboutWhy, 8, 160),
    aboutImage: image(src.aboutImage, base.aboutImage || "/images/mockup-about.jpg"),
    servicesTitle: text(src.servicesTitle, 80) || base.servicesTitle,
    servicesLead: text(src.servicesLead, 240) || base.servicesLead,
    servicesIntro: text(src.servicesIntro, 400) || base.servicesIntro,
    serviceHighlights,
    serviceGroups,
    consultationPage,
    supportPage,
    toolsTitle: text(src.toolsTitle, 80) || base.toolsTitle,
    toolsLead: text(src.toolsLead, 240) || base.toolsLead,
    tools,
    philosophyTitle: text(src.philosophyTitle, 160) || base.philosophyTitle,
    philosophyEyebrow: text(src.philosophyEyebrow, 80) || base.philosophyEyebrow,
    philosophyLead: text(src.philosophyLead, 160) || base.philosophyLead,
    philosophyIntro: lines(src.philosophyIntro, base.philosophyIntro || [], 6, 500),
    philosophyImage: image(src.philosophyImage, base.philosophyImage || "/images/mockup-philosophy.jpg"),
    philosophyNote: text(src.philosophyNote, 320) || base.philosophyNote || "",
    philosophySenses,
    philosophyConceptsTitle: text(src.philosophyConceptsTitle, 120) || base.philosophyConceptsTitle,
    philosophyConcepts,
    philosophyManageTitle: text(src.philosophyManageTitle, 100) || base.philosophyManageTitle,
    philosophyManage: lines(src.philosophyManage, base.philosophyManage || [], 8, 500),
    philosophyClose: text(src.philosophyClose, 400) || base.philosophyClose,
    philosophyTagline: text(src.philosophyTagline, 160) || base.philosophyTagline,
    reviewsTitle: text(src.reviewsTitle, 80) || base.reviewsTitle,
    reviewsLead: text(src.reviewsLead, 240) || base.reviewsLead,
    reviews,
    ctaTitle: text(src.ctaTitle, 160) || base.ctaTitle,
    ctaLead: text(src.ctaLead, 240) || base.ctaLead,
    ctaImage: image(src.ctaImage, base.ctaImage || "/images/mockup-cta.jpg"),
    formTitle: text(src.formTitle, 80) || base.formTitle,
    formIntro: lines(src.formIntro, base.formIntro, 6, 300),
    formTopics: lines(src.formTopics, base.formTopics, 14, 80),
    footerNote: text(src.footerNote, 120) || base.footerNote,
  };
}

function leadInput(body) {
  const src = body && typeof body === "object" ? body : {};
  const name = text(src.name, 80);
  const contact = text(src.contact || src.phone, 80);
  if (name.length < 2 || contact.length < 3) return null;

  const topics = Array.isArray(src.topics)
    ? src.topics.map((item) => text(item, 80)).filter(Boolean).slice(0, 12)
    : typeof src.topics === "string"
      ? text(src.topics, 400).split(",").map((item) => item.trim()).filter(Boolean).slice(0, 12)
      : [];

  const payload = {
    city: text(src.city, 80),
    businessName: text(src.businessName, 120),
    role: text(src.role, 80),
    years: text(src.years, 40),
    teamSize: text(src.teamSize, 40),
    mainServices: text(src.mainServices, 300),
    clientsPerMonth: text(src.clientsPerMonth, 80),
    concerns: text(src.concerns, 800),
    vision6months: text(src.vision6months, 800),
    triedAlready: text(src.triedAlready, 800),
    dependenceScore: text(src.dependenceScore, 8),
    readyForChange: text(src.readyForChange, 40),
    topics,
    otherTopic: text(src.otherTopic, 200),
    intent: text(src.intent, 40),
  };

  return {
    name,
    phone: contact,
    contact,
    eventType: payload.intent,
    eventDate: "",
    guests: "",
    message: text(
      [
        payload.city && `Місто: ${payload.city}`,
        payload.businessName && `Бізнес: ${payload.businessName}`,
        payload.role && `Посада: ${payload.role}`,
        payload.concerns && `Турбує: ${payload.concerns}`,
      ]
        .filter(Boolean)
        .join(" · "),
      1000
    ),
    payload,
  };
}

module.exports = { sanitize, leadInput, text };
