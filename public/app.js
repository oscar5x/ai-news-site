// Simple client to render data/data.json
const $ = (sel) => document.querySelector(sel);
const listEl = $("#list");
const filtersEl = $("#filters");
const searchEl = $("#search");
const updatedEl = $("#last-updated");
const refreshBtn = $("#refresh");

const state = {
  items: [],
  categories: new Set(),
  active: new Set(), // active categories
  q: ""
};

function bjDateTime(ts) {
  try {
    const dt = new Date(ts);
    return new Intl.DateTimeFormat('zh-CN', {
      timeZone: 'Asia/Shanghai',
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit'
    }).format(dt);
  } catch(e) { return ts; }
}

function render() {
  // Filters
  filtersEl.innerHTML = "";
  const allBtn = document.createElement("button");
  allBtn.className = "filter-btn" + (state.active.size === 0 ? " active" : "");
  allBtn.textContent = "全部";
  allBtn.onclick = () => { state.active.clear(); render(); };
  filtersEl.appendChild(allBtn);

  [...state.categories].sort().forEach(cat => {
    const btn = document.createElement("button");
    const active = state.active.has(cat);
    btn.className = "filter-btn" + (active ? " active" : "");
    btn.textContent = cat;
    btn.onclick = () => {
      if (active) state.active.delete(cat); else state.active.add(cat);
      render();
    };
    filtersEl.appendChild(btn);
  });

  // List
  const q = state.q.trim().toLowerCase();
  const activeCats = state.active;
  const filtered = state.items.filter(item => {
    const inCat = activeCats.size === 0 || activeCats.has(item.category);
    const inQ = !q || (item.title?.toLowerCase()?.includes(q) || item.source?.toLowerCase()?.includes(q));
    return inCat && inQ;
  });

  listEl.innerHTML = "";
  filtered.forEach(item => {
    const card = document.createElement("article");
    card.className = "card";

    const chip = document.createElement("span");
    chip.className = "chip";
    chip.textContent = item.category || "未分类";
    card.appendChild(chip);

    const title = document.createElement("h3");
    const link = document.createElement("a");
    link.href = item.link;
    link.target = "_blank";
    link.rel = "noopener";
    link.textContent = item.title || "(无标题)";
    title.appendChild(link);
    card.appendChild(title);

    if (item.summary) {
      const p = document.createElement("p");
      p.textContent = item.summary.slice(0, 160) + (item.summary.length > 160 ? "…" : "");
      card.appendChild(p);
    }

    const meta = document.createElement("div");
    meta.className = "meta";
    meta.innerHTML = `<span>${item.source || "来源"}</span>·<span>${bjDateTime(item.published_ts || item.published_at || item.date)}</span>`;
    card.appendChild(meta);

    listEl.appendChild(card);
  });
}

async function load() {
  // hourly cache-busting
  const v = Math.floor(Date.now() / 3600000);
  const res = await fetch(`./data/data.json?v=${v}`);
  const data = await res.json();

  updatedEl.textContent = `最近更新：${bjDateTime(data.generated_at)}`;
  state.items = data.items || [];
  state.categories = new Set(state.items.map(i => i.category).filter(Boolean));
  render();
}

searchEl.addEventListener("input", (e) => {
  state.q = e.target.value;
  render();
});
refreshBtn.addEventListener("click", () => load());

load().catch(err => {
  updatedEl.textContent = "加载失败，请稍后重试";
  console.error(err);
});
