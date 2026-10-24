/**
 * Makes each footer wordmark line span its container exactly. CSS container units
 * get within ~1–3% on first paint (no layout shift); font hinting at small sizes
 * rounds glyph advances, so this pass measures and corrects the remainder.
 */
export function fitWordmark() {
  const container = document.querySelector<HTMLElement>('.wordmark');
  if (!container) return;
  const lines = [...container.querySelectorAll<HTMLElement>('.wordmark__line')];

  const fit = () => {
    const target = container.clientWidth;
    for (const line of lines) {
      line.style.fontSize = ''; // back to the CSS estimate before measuring
      const width = line.getBoundingClientRect().width;
      if (!width) continue;
      const size = parseFloat(getComputedStyle(line).fontSize);
      line.style.fontSize = `${(size * target) / width}px`;
    }
  };

  let lastWidth = 0;
  new ResizeObserver(() => {
    if (container.clientWidth === lastWidth) return; // our own font-size change doesn't re-trigger
    lastWidth = container.clientWidth;
    fit();
  }).observe(container);
  void document.fonts.ready.then(fit);
}
