const FREE_GROUP_LIMIT = 3;

const els = {
  planBadge: document.getElementById("planBadge"),
  templateList: document.getElementById("templateList"),
  templateSelect: document.getElementById("templateSelect"),
  groupList: document.getElementById("groupList"),
  groupCount: document.getElementById("groupCount"),
  limitHint: document.getElementById("limitHint"),
  addTemplate: document.getElementById("addTemplate"),
  addGroup: document.getElementById("addGroup"),
  runPost: document.getElementById("runPost"),
  proToggle: document.getElementById("proToggle"),
  openOptions: document.getElementById("openOptions"),
  dialog: document.getElementById("editDialog"),
  editForm: document.getElementById("editForm"),
  dialogTitle: document.getElementById("dialogTitle"),
  nameLabel: document.getElementById("nameLabel"),
  editName: document.getElementById("editName"),
  editBody: document.getElementById("editBody"),
  editUrl: document.getElementById("editUrl"),
  bodyField: document.getElementById("bodyField"),
  urlField: document.getElementById("urlField"),
  cancelEdit: document.getElementById("cancelEdit"),
};

let state = { templates: [], groups: [], proUnlocked: false, selectedTemplateId: null };
let editMode = null; // { type: 'template'|'group', id?: string }

async function load() {
  const data = await chrome.storage.local.get([
    "templates",
    "groups",
    "proUnlocked",
    "selectedTemplateId",
  ]);
  state.templates = Array.isArray(data.templates) ? data.templates : [];
  state.groups = Array.isArray(data.groups) ? data.groups : [];
  state.proUnlocked = !!data.proUnlocked;
  state.selectedTemplateId =
    data.selectedTemplateId || state.templates[0]?.id || null;
  els.proToggle.checked = state.proUnlocked;
  render();
}

async function save() {
  await chrome.storage.local.set({
    templates: state.templates,
    groups: state.groups,
    proUnlocked: state.proUnlocked,
    selectedTemplateId: state.selectedTemplateId,
  });
}

function canAddGroup() {
  return state.proUnlocked || state.groups.length < FREE_GROUP_LIMIT;
}

function render() {
  els.planBadge.textContent = state.proUnlocked
    ? "Pro · unlimited"
    : `Free · ${FREE_GROUP_LIMIT} groups`;
  els.planBadge.classList.toggle("pro", state.proUnlocked);
  els.groupCount.textContent = `(${state.groups.length}${
    state.proUnlocked ? "" : `/${FREE_GROUP_LIMIT}`
  })`;
  els.limitHint.hidden = state.proUnlocked || state.groups.length < FREE_GROUP_LIMIT;
  els.addGroup.disabled = !canAddGroup();

  els.templateSelect.innerHTML = "";
  for (const t of state.templates) {
    const opt = document.createElement("option");
    opt.value = t.id;
    opt.textContent = t.title || "Untitled";
    if (t.id === state.selectedTemplateId) opt.selected = true;
    els.templateSelect.appendChild(opt);
  }

  els.templateList.innerHTML = "";
  for (const t of state.templates) {
    els.templateList.appendChild(
      row(t.title || "Untitled", (t.body || "").slice(0, 80), () => openTemplate(t), () => removeTemplate(t.id))
    );
  }

  els.groupList.innerHTML = "";
  for (const g of state.groups) {
    const item = row(g.name, g.url, () => openGroup(g), () => removeGroup(g.id));
    const check = document.createElement("input");
    check.type = "checkbox";
    check.checked = g.selected !== false;
    check.addEventListener("change", async () => {
      g.selected = check.checked;
      await save();
    });
    item.prepend(check);
    // row already has 3 cols; adjust for checkbox
    item.style.gridTemplateColumns = "auto 1fr auto";
    els.groupList.appendChild(item);
  }
}

function row(title, desc, onEdit, onDelete) {
  const wrap = document.createElement("div");
  wrap.className = "item";
  const meta = document.createElement("div");
  meta.className = "meta";
  meta.innerHTML = `<div class="title"></div><div class="desc"></div>`;
  meta.querySelector(".title").textContent = title;
  meta.querySelector(".desc").textContent = desc || "";
  meta.style.cursor = "pointer";
  meta.addEventListener("click", onEdit);
  const del = document.createElement("button");
  del.type = "button";
  del.className = "icon-btn";
  del.title = "Delete";
  del.textContent = "✕";
  del.addEventListener("click", onDelete);
  wrap.append(meta, del);
  return wrap;
}

function openTemplate(t = null) {
  editMode = { type: "template", id: t?.id };
  els.dialogTitle.textContent = t ? "Edit template" : "New template";
  els.nameLabel.textContent = "Title";
  els.bodyField.hidden = false;
  els.urlField.hidden = true;
  els.editName.value = t?.title || "";
  els.editBody.value = t?.body || "";
  els.editUrl.value = "";
  els.editName.required = true;
  els.editUrl.required = false;
  els.dialog.showModal();
}

function openGroup(g = null) {
  if (!g && !canAddGroup()) {
    els.limitHint.hidden = false;
    return;
  }
  editMode = { type: "group", id: g?.id };
  els.dialogTitle.textContent = g ? "Edit group" : "New group";
  els.nameLabel.textContent = "Display name";
  els.bodyField.hidden = true;
  els.urlField.hidden = false;
  els.editName.value = g?.name || "";
  els.editBody.value = "";
  els.editUrl.value = g?.url || "";
  els.editName.required = true;
  els.editUrl.required = true;
  els.dialog.showModal();
}

async function removeTemplate(id) {
  state.templates = state.templates.filter((t) => t.id !== id);
  if (state.selectedTemplateId === id) {
    state.selectedTemplateId = state.templates[0]?.id || null;
  }
  await save();
  render();
}

async function removeGroup(id) {
  state.groups = state.groups.filter((g) => g.id !== id);
  await save();
  render();
}

els.addTemplate.addEventListener("click", () => openTemplate());
els.addGroup.addEventListener("click", () => openGroup());
els.cancelEdit.addEventListener("click", () => els.dialog.close());

els.editForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!editMode) return;
  if (editMode.type === "template") {
    const payload = {
      id: editMode.id || crypto.randomUUID(),
      title: els.editName.value.trim(),
      body: els.editBody.value.trim(),
    };
    const idx = state.templates.findIndex((t) => t.id === payload.id);
    if (idx >= 0) state.templates[idx] = payload;
    else state.templates.push(payload);
    state.selectedTemplateId = payload.id;
  } else {
    if (!editMode.id && !canAddGroup()) return;
    let url = els.editUrl.value.trim();
    if (!/^https?:\/\//i.test(url)) url = "https://" + url;
    const payload = {
      id: editMode.id || crypto.randomUUID(),
      name: els.editName.value.trim(),
      url,
      selected: true,
    };
    const idx = state.groups.findIndex((g) => g.id === payload.id);
    if (idx >= 0) state.groups[idx] = { ...state.groups[idx], ...payload };
    else state.groups.push(payload);
  }
  await save();
  els.dialog.close();
  render();
});

els.templateSelect.addEventListener("change", async () => {
  state.selectedTemplateId = els.templateSelect.value;
  await save();
});

els.proToggle.addEventListener("change", async () => {
  state.proUnlocked = els.proToggle.checked;
  await save();
  render();
});

els.openOptions.addEventListener("click", (e) => {
  e.preventDefault();
  alert(
    "GroupPost pricing (planned)\n\nFree: up to 3 groups, 3 templates\nPro: $9/mo — unlimited groups + templates\n\nStripe checkout comes next. The Pro checkbox is a local stub for weekend testing.\n\nWe never auto-click Post on Facebook."
  );
});

els.runPost.addEventListener("click", async () => {
  const template = state.templates.find((t) => t.id === state.selectedTemplateId);
  if (!template?.body) {
    alert("Pick or create a template with body text first.");
    return;
  }
  const selected = state.groups.filter((g) => g.selected !== false);
  if (!selected.length) {
    alert("Select at least one group.");
    return;
  }
  if (!state.proUnlocked && selected.length > FREE_GROUP_LIMIT) {
    alert(`Free plan allows ${FREE_GROUP_LIMIT} groups. Deselect some or enable Pro stub.`);
    return;
  }

  // Stagger tab opens so Facebook doesn't throttle as hard
  for (let i = 0; i < selected.length; i++) {
    const g = selected[i];
    const u = new URL(g.url);
    u.searchParams.set("grouppost_body", template.body);
    await chrome.tabs.create({ url: u.toString(), active: i === 0 });
    await new Promise((r) => setTimeout(r, 400));
  }
});

load();
