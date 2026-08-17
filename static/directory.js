const grid = document.querySelector("#site-grid");
const escapeHTML = (value) => String(value).replace(/[&<>'"]/g, (character) => ({
  "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;"
}[character]));

fetch("/api/sites")
  .then((response) => {
    if (!response.ok) throw new Error("The directory could not be loaded.");
    return response.json();
  })
  .then(({ sites }) => {
    grid.innerHTML = sites.map((site, index) => `
      <a class="site-card" href="${escapeHTML(site.url)}" style="--accent:${escapeHTML(site.accent)}">
        <div class="site-card-top">
          <span class="site-symbol" aria-hidden="true">${escapeHTML(site.symbol)}</span>
          <span class="site-index">${String(index + 1).padStart(2,"0")} / ${String(sites.length).padStart(2,"0")}</span>
        </div>
        <div class="site-card-bottom">
          <div>
            <h2>${escapeHTML(site.name)}</h2>
            <p>${escapeHTML(site.description)}</p>
            <div class="site-url">${escapeHTML(new URL(site.url).host)}</div>
          </div>
          <span class="site-arrow" aria-hidden="true">↗</span>
        </div>
      </a>
    `).join("");
  })
  .catch(() => {
    grid.innerHTML = '<div class="loading-card">Directory unavailable</div>';
  });
