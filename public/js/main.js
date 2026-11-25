const header = document.querySelector(".header");
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");

if (toggle && nav && header) {
  const label = toggle.querySelector(".visually-hidden");

  const setOpen = (open) => {
    header.classList.toggle("is-open", open);
    document.body.classList.toggle("is-nav-open", open);
    toggle.setAttribute("aria-expanded", String(open));
    if (label) label.textContent = open ? "Закрити" : "Меню";
  };

  toggle.addEventListener("click", () => {
    setOpen(!header.classList.contains("is-open"));
  });

  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) setOpen(false);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape") setOpen(false);
  });
}

const modal = document.querySelector("#form-modal");
const form = document.querySelector("#lead-form");
const note = document.querySelector("#form-note");
const intentInput = document.querySelector("#form-intent");
const panels = {
  consultatsiya: document.querySelector("#consultatsiya"),
  suprovid: document.querySelector("#suprovid"),
};

function openModal(intent) {
  if (!modal) return;
  if (intentInput) intentInput.value = intent || "consultation";
  modal.hidden = false;
  document.body.classList.add("is-modal-open");
  const first = modal.querySelector("input, select, textarea, button");
  if (first) first.focus();
}

function closeModal() {
  if (!modal) return;
  modal.hidden = true;
  document.body.classList.remove("is-modal-open");
}

function openPanel(id) {
  const panel = panels[id];
  if (!panel) return;
  Object.values(panels).forEach((item) => {
    if (item) item.hidden = true;
  });
  panel.hidden = false;
  document.body.classList.add("is-modal-open");
}

function closePanels() {
  Object.values(panels).forEach((item) => {
    if (item) item.hidden = true;
  });
  if (!modal || modal.hidden) document.body.classList.remove("is-modal-open");
}

document.addEventListener("click", (event) => {
  const openForm = event.target.closest("[data-open-form]");
  if (openForm) {
    event.preventDefault();
    closePanels();
    openModal(openForm.getAttribute("data-intent") || "consultation");
    return;
  }
  if (event.target.closest("[data-close-modal]")) {
    closeModal();
    return;
  }
  if (event.target.closest("[data-close-panel]")) {
    closePanels();
    if (location.hash === "#consultatsiya" || location.hash === "#suprovid") {
      history.replaceState(null, "", location.pathname + location.search);
    }
  }
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  closeModal();
  closePanels();
});

function syncHash() {
  const hash = location.hash.replace("#", "");
  if (hash === "consultatsiya" || hash === "suprovid") {
    openPanel(hash);
  } else {
    closePanels();
  }
}

window.addEventListener("hashchange", syncHash);
syncHash();

if (form && note) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    note.textContent = "Надсилаємо…";

    const data = new FormData(form);
    const topics = data.getAll("topics");
    const body = Object.fromEntries(data.entries());
    body.topics = topics;

    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.status === 400) {
        note.textContent = "Перевірте ПІБ і контакт для зв’язку.";
        return;
      }
      if (response.status === 404) {
        note.textContent = "Сервер заявок ще не підключений. Напишіть у Telegram.";
        return;
      }
      if (response.status === 429) {
        note.textContent = "Забагато заявок з цього пристрою. Напишіть у Telegram або на пошту.";
        return;
      }
      if (!response.ok) throw new Error("fail");
      form.reset();
      if (intentInput) intentInput.value = "consultation";
      note.textContent = "Дякую. Заявку отримано — скоро зв’яжусь із вами.";
    } catch {
      note.textContent = "Заявку зараз не вдалося надіслати. Напишіть у Telegram або на пошту.";
    }
  });
}
