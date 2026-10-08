(function () {
  const nav = document.currentScript?.previousElementSibling?.matches?.('nav')
    ? document.currentScript.previousElementSibling
    : document.querySelector('nav.navbar');
  if (!nav) return;

  const stylesheet = document.createElement('link');
  stylesheet.rel = 'stylesheet';
  stylesheet.href = 'assets/css/header.css';
  document.head.appendChild(stylesheet);

  const page = (location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isActive = (...files) => (files.includes(page) ? ' is-active' : '');

  nav.className = 'mca-header';
  nav.removeAttribute('data-bs-theme');
  nav.innerHTML = `
    <div class="mca-header__inner">
      <div class="logo-zone">
        <a class="mca-header__brand" href="index.html" aria-label="MCA Pièces Autos 38">
          <span class="mca-header__logo"><i class="fa-solid fa-car-side"></i></span>
          <span>MCA PIÈCES AUTOS 38</span>
        </a>
      </div>
      <button class="mca-header__toggle" type="button" aria-expanded="false" aria-controls="mcaHeaderCenter mcaHeaderRight" aria-label="Ouvrir le menu">
        <i class="fa-solid fa-bars"></i>
      </button>
      <div class="menu-zone" id="mcaHeaderCenter">
        <ul class="mca-header__links">
          <li><a class="mca-header__link${isActive('index.html')}" href="index.html">Accueil</a></li>
          <li><a class="mca-header__link${isActive('services.html')}" href="services.html">Services</a></li>
          <li><a class="mca-header__link${isActive('galerie.html')}" href="galerie.html">Galerie</a></li>
          <li><a class="mca-header__link${isActive('contact.html')}" href="contact.html">Contact</a></li>
          <li><a class="mca-header__link${isActive('catalogue.html')}" href="catalogue.html">Catalogue</a></li>
        </ul>
      </div>
      <div class="user-zone" id="mcaHeaderRight">
        <div class="mca-header__actions">
          <a class="mca-header__btn mca-header__btn--solid${isActive('contact.html')}" href="contact.html">
            <i class="fa-solid fa-phone"></i><span>Contact</span>
          </a>
        </div>
      </div>
    </div>`;

  const toggle = nav.querySelector('.mca-header__toggle');
  toggle.addEventListener('click', () => {
    const open = nav.classList.toggle('is-open');
    toggle.setAttribute('aria-expanded', String(open));
  });
})();