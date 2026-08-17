const state = { sites: [], filtered: [], activeIndex: 0 };

const grid = document.querySelector("#site-grid");
const emptyState = document.querySelector(".empty-state");
const search = document.querySelector("#site-search");
const dialog = document.querySelector(".command-menu");
const dialogInput = dialog.querySelector("input");
const dialogResults = dialog.querySelector(".command-results");

const escapeHTML = (value) => String(value).replace(/[&<>'"]/g, (char) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
}[char]));

function renderCards(sites) {
  grid.innerHTML = sites.map((site, index) => `
    <a class="site-card" href="${escapeHTML(site.url)}" style="--accent:${escapeHTML(site.accent)}" data-id="${escapeHTML(site.id)}">
      <div class="site-card-top">
        <span class="site-symbol">${escapeHTML(site.symbol)}</span>
        <span class="site-index">0${index + 1} / 0${state.sites.length}</span>
      </div>
      <div class="site-card-bottom">
        <div>
          <h3>${escapeHTML(site.name)}</h3>
          <p>${escapeHTML(site.description)}</p>
          <div class="site-url">${escapeHTML(new URL(site.url).host)}</div>
        </div>
        <span class="site-arrow" aria-hidden="true">↗</span>
      </div>
    </a>
  `).join("");
  emptyState.hidden = sites.length > 0;
  grid.hidden = sites.length === 0;
}

function filterSites(query) {
  const normalized = query.trim().toLocaleLowerCase("ru");
  return state.sites.filter((site) => [site.name, site.description, site.url, ...site.tags]
    .join(" ").toLocaleLowerCase("ru").includes(normalized));
}

function renderCommands(query = "") {
  state.filtered = filterSites(query);
  state.activeIndex = Math.min(state.activeIndex, Math.max(0, state.filtered.length - 1));
  dialogResults.innerHTML = state.filtered.map((site, index) => `
    <button class="command-option ${index === state.activeIndex ? "active" : ""}" type="button" role="option" aria-selected="${index === state.activeIndex}" data-index="${index}" style="--option-accent:${escapeHTML(site.accent)}">
      <span>${escapeHTML(site.symbol)}</span>
      <span><strong>${escapeHTML(site.name)}</strong><small>${escapeHTML(new URL(site.url).host)}</small></span>
      <kbd>${escapeHTML(site.shortcut)}</kbd>
    </button>
  `).join("") || '<div class="command-option">No matches</div>';
}

function openCommand() {
  renderCommands();
  dialog.showModal();
  requestAnimationFrame(() => dialogInput.focus());
}

function visit(site) {
  if (site) window.location.href = site.url;
}

fetch("/api/sites")
  .then((response) => {
    if (!response.ok) throw new Error("Network response failed");
    return response.json();
  })
  .then((data) => {
    state.sites = data.sites;
    state.filtered = data.sites;
    renderCards(state.sites);
    renderCommands();
  })
  .catch(() => {
    grid.innerHTML = '<div class="loading-card">The directory is temporarily unavailable. Refresh the page.</div>';
  });

search.addEventListener("input", (event) => renderCards(filterSites(event.target.value)));
document.querySelector(".command-trigger").addEventListener("click", openCommand);
dialog.querySelector(".command-head button").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });
dialogInput.addEventListener("input", (event) => { state.activeIndex = 0; renderCommands(event.target.value); });
dialogResults.addEventListener("click", (event) => {
  const option = event.target.closest(".command-option[data-index]");
  if (option) visit(state.filtered[Number(option.dataset.index)]);
});

document.querySelector(".shuffle-action").addEventListener("click", () => {
  if (!state.sites.length) return;
  visit(state.sites[Math.floor(Math.random() * state.sites.length)]);
});

document.addEventListener("keydown", (event) => {
  const isTyping = ["INPUT", "TEXTAREA"].includes(document.activeElement?.tagName);
  if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
    event.preventDefault();
    dialog.open ? dialog.close() : openCommand();
    return;
  }
  if (event.key === "/" && !isTyping && !dialog.open) {
    event.preventDefault();
    search.focus();
    return;
  }
  if (dialog.open) {
    if (event.key === "ArrowDown" || event.key === "ArrowUp") {
      event.preventDefault();
      const delta = event.key === "ArrowDown" ? 1 : -1;
      state.activeIndex = (state.activeIndex + delta + state.filtered.length) % state.filtered.length;
      renderCommands(dialogInput.value);
      dialogResults.querySelector(".active")?.scrollIntoView({ block: "nearest" });
    }
    if (event.key === "Enter") {
      event.preventDefault();
      visit(state.filtered[state.activeIndex]);
    }
    return;
  }
  if (!isTyping) {
    const matched = state.sites.find((site) => site.shortcut.toLowerCase() === event.key.toLowerCase());
    if (matched) visit(matched);
  }
});

const cursorGlow = document.querySelector(".cursor-glow");
window.addEventListener("pointermove", (event) => {
  cursorGlow.style.left = `${event.clientX}px`;
  cursorGlow.style.top = `${event.clientY}px`;
}, { passive: true });

function tick() {
  document.querySelector("#clock").textContent = new Intl.DateTimeFormat("ru-RU", {
    hour: "2-digit", minute: "2-digit", second: "2-digit", hour12: false
  }).format(new Date());
}
tick();
setInterval(tick, 1000);

const revealObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      entry.target.animate([
        { opacity: 0, transform: "translateY(24px)" },
        { opacity: 1, transform: "translateY(0)" }
      ], { duration: 650, easing: "cubic-bezier(.2,.8,.2,1)", fill: "both" });
      revealObserver.unobserve(entry.target);
    }
  });
}, { threshold: .12 });
document.querySelectorAll(".section-heading, .manifesto-layout").forEach((element) => revealObserver.observe(element));
