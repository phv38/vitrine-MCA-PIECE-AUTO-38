const catalogState = {
  products: [],
  category: 'Tous',
  search: '',
  sort: 'featured',
  loadingMessage: 'Chargement des produits…'
};

const CATALOG_EXAMPLES = [
  {
    id: 'batterie-varta',
    name: 'Batterie auto',
    description: 'Exemple de batterie de remplacement adaptée à un usage courant.',
    price: 99.9,
    category: 'Batteries',
    reference: 'BAT-001',
    image: 'https://placehold.co/640x420/f5f5f5/111111?text=Batterie'
  },
  {
    id: 'filtre-huile',
    name: 'Filtre à huile',
    description: 'Exemple de filtre pour entretien moteur et vidange régulière.',
    price: 12.5,
    category: 'Filtres',
    reference: 'FIL-002',
    image: 'https://placehold.co/640x420/f5f5f5/111111?text=Filtre'
  },
  {
    id: 'bougies-allumage',
    name: 'Bougies',
    description: 'Exemple de bougies d’allumage pour démarrage et performance moteur.',
    price: 18.9,
    category: 'Bougies',
    reference: 'BOU-003',
    image: 'https://placehold.co/640x420/f5f5f5/111111?text=Bougies'
  },
  {
    id: 'amortisseurs-avant',
    name: 'Amortisseurs',
    description: 'Exemple d’amortisseurs avant pour confort, tenue de route et sécurité.',
    price: 129,
    category: 'Amortisseurs',
    reference: 'AMO-004',
    image: 'https://placehold.co/640x420/f5f5f5/111111?text=Amortisseurs'
  }
];

function catalogEscape(value) {
  return String(value ?? '').replace(/[&<>"']/g, (character) => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  })[character]);
}

function catalogPrice(value) {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(Number(value) || 0);
}

function normalizeProduct(row) {
  return {
    id: row.id,
    name: row.name || row.nom || row.libelle || 'Produit',
    description: row.description || row.description_fr || '',
    price: Number(row.price ?? row.prix ?? 0),
    category: row.category || row.categorie || 'Divers',
    reference: row.reference || row.ref || '',
    image: row.image_url || row.image || row.img || ''
  };
}

function getVisibleProducts() {
  let visible = [...catalogState.products];
  const query = catalogState.search.trim().toLocaleLowerCase('fr-FR');

  if (catalogState.category !== 'Tous') {
    visible = visible.filter((product) => product.category === catalogState.category);
  }

  if (query) {
    visible = visible.filter((product) => [
      product.name,
      product.description,
      product.reference,
      product.category
    ].join(' ').toLocaleLowerCase('fr-FR').includes(query));
  }

  switch (catalogState.sort) {
    case 'price-asc':
      visible.sort((left, right) => left.price - right.price);
      break;
    case 'price-desc':
      visible.sort((left, right) => right.price - left.price);
      break;
    case 'name-asc':
      visible.sort((left, right) => left.name.localeCompare(right.name, 'fr'));
      break;
    case 'name-desc':
      visible.sort((left, right) => right.name.localeCompare(left.name, 'fr'));
      break;
    default:
      visible.sort((left, right) => String(left.id).localeCompare(String(right.id), 'fr', { numeric: true }));
  }

  return visible;
}

function renderCategoryFilters() {
  const container = document.getElementById('categoryFilters');
  if (!container) return;

  const categories = ['Tous', ...new Set(catalogState.products.map((product) => product.category))];
  container.innerHTML = categories.map((category) => `
    <button type="button" class="filter-chip${category === catalogState.category ? ' active' : ''}"
      data-category="${catalogEscape(category)}" aria-pressed="${category === catalogState.category}">
      ${catalogEscape(category)}
    </button>
  `).join('');

  container.querySelectorAll('[data-category]').forEach((button) => {
    button.addEventListener('click', () => {
      catalogState.category = button.dataset.category;
      renderCategoryFilters();
      renderProducts();
    });
  });
}

function renderProducts() {
  const grid = document.getElementById('productGrid');
  if (!grid) return;

  const products = getVisibleProducts();
  if (!products.length) {
    const message = catalogState.products.length
      ? 'Aucun exemple ne correspond à votre recherche.'
      : catalogState.loadingMessage;
    grid.innerHTML = `
      <div class="col-12">
        <div class="card h-100"><div class="card-body py-5 text-center text-muted">
          <p class="mb-0">${catalogEscape(message)}</p>
        </div></div>
      </div>
    `;
    return;
  }

  grid.innerHTML = products.map((product) => {
    const name = catalogEscape(product.name);
    const description = catalogEscape(product.description);
    const category = catalogEscape(product.category);
    const reference = catalogEscape(product.reference);
    const image = catalogEscape(product.image || 'https://placehold.co/640x420/f5f5f5/111111?text=Piece+auto');

    return `
      <div class="col">
        <article class="card h-100 product-card">
          <img class="card-img-top" src="${image}" alt="${name}" loading="lazy" />
          <div class="card-body d-flex flex-column product-body">
            <span class="product-tag">${category}</span>
            <h3 class="card-title">${name}</h3>
            ${description ? `<p class="card-text text-muted">${description}</p>` : ''}
            <div class="product-meta">
              ${reference ? `<span>Réf. ${reference}</span>` : '<span></span>'}
              <span>Exemple de pièce</span>
            </div>
            <div class="mt-2">
              <span class="badge bg-secondary">Exemple de disponibilité</span>
            </div>
            <div class="product-price mt-auto">
              <div class="price">${catalogPrice(product.price)}</div>
              <a class="btn btn-primary" href="contact.html">
                Demander une information
              </a>
            </div>
          </div>
        </article>
      </div>
    `;
  }).join('');
}

function renderMiniCart() {
  // Code e-commerce conservé mais désactivé pour la version vitrine.
  return;
}

async function loadCatalogProducts() {
  catalogState.products = CATALOG_EXAMPLES.map(normalizeProduct);
  window.products = catalogState.products;
  catalogState.loadingMessage = '';
  renderCategoryFilters();
  renderProducts();
}

document.addEventListener('DOMContentLoaded', () => {
  document.getElementById('searchInput')?.addEventListener('input', (event) => {
    catalogState.search = event.target.value;
    renderProducts();
  });

  document.getElementById('sortSelect')?.addEventListener('change', (event) => {
    catalogState.sort = event.target.value;
    renderProducts();
  });

  const year = document.getElementById('year');
  if (year) year.textContent = new Date().getFullYear();

  renderCategoryFilters();
  renderMiniCart();
  loadCatalogProducts();
});
