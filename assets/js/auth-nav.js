function updateAuthenticationLinks(session) {
  // Le code e-commerce est conservé, mais l'accès compte/connexion est désactivé visuellement
  // pour la version vitrine. Il peut être réactivé en restaurant ce bloc si besoin.
  void session;
}

async function initializeAuthenticationLinks() {
  updateAuthenticationLinks(null);
}

document.addEventListener('DOMContentLoaded', initializeAuthenticationLinks);
