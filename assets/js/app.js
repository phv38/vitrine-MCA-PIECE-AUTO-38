const app = {
  // Les fonctions e-commerce sont conservées ici pour une réactivation future,
  // mais elles ne sont plus exposées dans la navigation vitrine.
};

document.addEventListener('DOMContentLoaded', () => {
  const yearNode = document.getElementById('year');
  if (yearNode) yearNode.textContent = new Date().getFullYear();
});

window.app = app;
