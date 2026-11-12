const login = document.querySelector("#login");
const editor = document.querySelector("#editor");
const fields = document.querySelector("#fields");
const leads = document.querySelector("#leads");
const loginNote = document.querySelector("#login-note");
const saveNote = document.querySelector("#save-note");
let content = null;

function api(path, options = {}) {
  return fetch(path, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      "X-Schastia": "1",
      ...(options.headers || {}),
    },
  });
}

function field(label, value, onInput, multiline) {
  const wrap = document.createElement("label");
  wrap.textContent = label;
  const input = document.createElement(multiline ? "textarea" : "input");
  if (multiline) input.rows = 4;
  input.value = value || "";
  input.addEventListener("input", () => onInput(input.value));
  wrap.append(input);
  return wrap;
}

function lines(value) {
  return String(value || "")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean);
}

function block(title) {
  const box = document.createElement("section");
  box.className = "block";
  const heading = document.createElement("h2");
  heading.textContent = title;
  const grid = document.createElement("div");
  grid.className = "fields";
  box.append(heading, grid);
  fields.append(box);
  return grid;
}

function draw() {
  fields.replaceChildren();
  const main = block("Сайт і контакти");
  main.append(
    field("Заголовок для Google", content.seoTitle, (v) => { content.seoTitle = v; }),
    field("Опис для Google", content.seoDescription, (v) => { content.seoDescription = v; }, true),
    field("Назва", content.brandName, (v) => { content.brandName = v; }),
    field("Підпис", content.kicker, (v) => { content.kicker = v; }),
    field("Телефон на сайті", content.phoneDisplay, (v) => { content.phoneDisplay = v; }),
    field("Телефон для дзвінка, з +380", content.phoneTel, (v) => { content.phoneTel = v; }),
    field("Адреса, кожен рядок окремо", content.addressLines.join("\n"), (v) => { content.addressLines = lines(v); }, true),
    field("Адреса для карти", content.mapQuery, (v) => { content.mapQuery = v; }),
    field("Instagram, повне посилання", content.instagramUrl, (v) => { content.instagramUrl = v; }),
    field("Instagram, як показано", content.instagramHandle, (v) => { content.instagramHandle = v; })
  );

  const hero = block("Перший екран");
  hero.append(
    field("Рядок над заголовком", content.heroEyebrow, (v) => { content.heroEyebrow = v; }),
    field("Головний заголовок", content.heroTitle, (v) => { content.heroTitle = v; }),
    field("Короткий акцент", content.heroLead, (v) => { content.heroLead = v; }, true),
    field("Текст", content.heroText, (v) => { content.heroText = v; }, true),
    field("Для кого, кожен пункт з нового рядка", content.audiences.join("\n"), (v) => { content.audiences = lines(v); }, true)
  );

  content.services.forEach((service, index) => {
    const box = block(`Послуга: ${service.title}`);
    box.append(
      field("Назва", service.title, (v) => { content.services[index].title = v; }),
      field("Коротко", service.summary, (v) => { content.services[index].summary = v; }, true),
      field("Опис", service.text, (v) => { content.services[index].text = v; }, true),
      field("Пункти, кожен з нового рядка", service.points.join("\n"), (v) => { content.services[index].points = lines(v); }, true),
      field("Фото, шлях /images/…", service.image, (v) => { content.services[index].image = v; }),
      field("Підпис до фото", service.imageAlt, (v) => { content.services[index].imageAlt = v; })
    );
  });

  content.steps.forEach((step, index) => {
    const box = block(`Крок ${index + 1}`);
    box.append(
      field("Назва", step.title, (v) => { content.steps[index].title = v; }),
      field("Текст", step.text, (v) => { content.steps[index].text = v; }, true)
    );
  });

  content.extras.forEach((item, index) => {
    const box = block(`Додатково: ${item.title}`);
    box.append(
      field("Назва", item.title, (v) => { content.extras[index].title = v; }),
      field("Текст", item.text, (v) => { content.extras[index].text = v; }, true)
    );
  });

  content.faq.forEach((item, index) => {
    const box = block(`Питання ${index + 1}`);
    box.append(
      field("Питання", item.q, (v) => { content.faq[index].q = v; }),
      field("Відповідь", item.a, (v) => { content.faq[index].a = v; }, true)
    );
  });

  const form = block("Форма і підвал");
  form.append(
    field("Заголовок форми", content.formTitle, (v) => { content.formTitle = v; }),
    field("Текст біля форми", content.formText, (v) => { content.formText = v; }, true),
    field("Рядок у підвалі", content.footerNote, (v) => { content.footerNote = v; })
  );
}

function drawLeads(rows) {
  leads.replaceChildren();
  if (!rows.length) {
    const empty = document.createElement("p");
    empty.className = "muted";
    empty.textContent = "Заявок поки немає.";
    leads.append(empty);
    return;
  }
  rows.forEach((row) => {
    const item = document.createElement("article");
    item.className = "lead-row";
    const title = document.createElement("strong");
    title.textContent = `${row.name} · ${row.phone}`;
    const meta = document.createElement("p");
    meta.className = "muted";
    meta.textContent = [row.eventType || row.event_type, row.eventDate || row.event_date, row.guests].filter(Boolean).join(" · ");
    const message = document.createElement("p");
    message.textContent = row.message || "";
    item.append(title, meta, message);
    leads.append(item);
  });
}

async function openEditor() {
  const response = await api("/api/content");
  if (!response.ok) return;
  content = await response.json();
  draw();
  const leadResponse = await api("/api/leads");
  drawLeads(leadResponse.ok ? await leadResponse.json() : []);
  const status = await api("/api/status");
  if (status.ok) {
    const info = await status.json();
    const note = document.createElement("p");
    note.className = "muted";
    note.textContent = info.telegramConfigured
      ? "Telegram підключено: нові заявки також ідуть у бота."
      : "Telegram ще не підключено. Поки заявки видно лише тут.";
    leads.prepend(note);
  }
  login.hidden = true;
  editor.hidden = false;
}

document.querySelector("#login-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  loginNote.textContent = "";
  const password = new FormData(event.currentTarget).get("password");
  const response = await api("/api/login", { method: "POST", body: JSON.stringify({ password }) });
  if (response.status === 503) {
    loginNote.textContent = "Пароль адмінки ще не додано в секрети Cursor. Назва секрету: ADMIN_PASSWORD.";
    return;
  }
  if (!response.ok) {
    loginNote.textContent = "Пароль не підійшов.";
    return;
  }
  await openEditor();
});

document.querySelector("#save").addEventListener("click", async () => {
  saveNote.textContent = "Зберігаємо…";
  const response = await api("/api/content", { method: "PUT", body: JSON.stringify(content) });
  saveNote.textContent = response.ok ? "Збережено. Оновіть сайт, щоб побачити зміни." : "Не вдалося зберегти.";
});

document.querySelector("#logout").addEventListener("click", async () => {
  await api("/api/logout", { method: "POST", body: "{}" });
  content = null;
  editor.hidden = true;
  login.hidden = false;
});

api("/api/session").then((response) => {
  if (response.ok) openEditor();
});
