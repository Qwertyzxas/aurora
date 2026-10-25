import { CALLOUTS, COLORS, LIGHT_MODES, SCENARIOS, SPECS } from '../content';
import { formatNumber } from '../lib/format';

export const $ = <T extends HTMLElement = HTMLElement>(selector: string, root: ParentNode = document) =>
  root.querySelector<T>(selector)!;

function h(tag: string, attrs: Record<string, string> = {}, ...children: (Node | string)[]) {
  const node = document.createElement(tag);
  for (const [name, value] of Object.entries(attrs)) node.setAttribute(name, value);
  node.append(...children);
  return node;
}

export function renderContent() {
  $('#callouts').append(
    ...CALLOUTS.map((c) =>
      h(
        'li',
        { class: 'callout', 'data-anchor': c.anchor },
        h('span', { class: 'callout__dot' }),
        h('span', { class: 'callout__line' }),
        h('div', { class: 'callout__card' }, h('h3', {}, c.title), h('p', {}, c.text)),
      ),
    ),
  );

  $('#modes').append(
    ...LIGHT_MODES.map((m, i) =>
      h(
        'button',
        { type: 'button', class: 'mode', 'data-mode': m.id, 'aria-pressed': String(i === 0) },
        h('i', { class: 'mode__swatch', style: `background: linear-gradient(135deg, ${m.colors.join(', ')})` }),
        m.name,
      ),
    ),
  );

  $('#scenarios-track').append(
    ...SCENARIOS.map((s) =>
      h(
        'li',
        { class: 'scenario' },
        h('div', { class: 'scenario__art', style: `background: ${s.gradient}` }, h('span', {}, s.time)),
        h('h3', {}, s.title),
        h('p', {}, s.text),
      ),
    ),
  );

  $('#swatches').append(
    ...COLORS.map((c, i) =>
      h(
        'button',
        { type: 'button', class: 'swatch', 'data-color': c.id, 'aria-pressed': String(i === 0) },
        h('i', { style: `background: ${c.swatch}` }),
        h('span', { class: 'swatch__label' }, c.name),
      ),
    ),
  );

  $('#specs-grid').append(
    ...SPECS.map((s) => {
      const decimals = s.decimals ?? 0;
      return h(
        'div',
        { class: 'spec' },
        h('dt', {}, s.label),
        h(
          'dd',
          {},
          h('span', { class: 'spec__value', 'data-value': String(s.value), 'data-decimals': String(decimals) }, formatNumber(s.value, decimals)),
          h('span', { class: 'spec__unit' }, s.unit),
        ),
      );
    }),
  );
}
