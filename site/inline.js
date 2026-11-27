if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
  document.documentElement.classList.add('js-reduced-motion');
} else {
  document.documentElement.classList.add('js-motion');
}
