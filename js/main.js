const header = document.querySelector(".header");
const toggle = document.querySelector(".nav-toggle");
const nav = document.querySelector(".nav");

if (toggle && nav) {
  toggle.addEventListener("click", () => {
    const open = header.classList.toggle("is-open");
    toggle.setAttribute("aria-expanded", String(open));
  });
  nav.addEventListener("click", (event) => {
    if (event.target.closest("a")) {
      header.classList.remove("is-open");
      toggle.setAttribute("aria-expanded", "false");
    }
  });
}

const form = document.querySelector("#lead-form");
const note = document.querySelector("#form-note");
if (form && note) {
  form.addEventListener("submit", async (event) => {
    event.preventDefault();
    note.textContent = "Надсилаємо…";
    const body = Object.fromEntries(new FormData(form));
    try {
      const response = await fetch("/api/leads", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
      if (response.status === 400) {
        note.textContent = "Перевірте ім’я і телефон (мінімум 10 цифр).";
        return;
      }
      if (response.status === 429) {
        note.textContent = "Забагато заявок з цього пристрою. Зателефонуйте нам.";
        return;
      }
      if (!response.ok) throw new Error("fail");
      form.reset();
      note.textContent = "Дякуємо. Ми передзвонимо і запропонуємо формат під вашу подію.";
    } catch {
      const phone = document.querySelector(".big-phone");
      note.textContent = phone
        ? `Заявку зараз не вдалося зберегти. Зателефонуйте: ${phone.textContent}`
        : "Заявку зараз не вдалося зберегти. Зателефонуйте нам.";
    }
  });
}
