export function fitWordmark() {
  const container = document.querySelector<HTMLElement>('.wordmark');
  if (!container) return;
  const lines = [...container.querySelectorAll<HTMLElement>('.wordmark__line')];

  const fit = () => {
    const target = container.clientWidth;
    for (const line of lines) {
      line.style.fontSize = '';
      const width = line.getBoundingClientRect().width;
      if (!width) continue;
      const size = parseFloat(getComputedStyle(line).fontSize);
      line.style.fontSize = `${(size * target) / width}px`;
    }
  };

  let lastWidth = 0;
  new ResizeObserver(() => {
    if (container.clientWidth === lastWidth) return;
    lastWidth = container.clientWidth;
    fit();
  }).observe(container);
  void document.fonts.ready.then(fit);
}
