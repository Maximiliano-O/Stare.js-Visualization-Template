'use strict';

import { v4 as uuidv4 } from 'uuid';

export default function index({
  color,
  columns = null,
  format = x => x,
  swatchSize = 15,
  swatchWidth = swatchSize,
  swatchHeight = swatchSize,
  marginLeft = 0
}) {
  const id = uuidv4();

  if (columns !== null) return html`<div style="display: flex; align-items: center; margin-left: ${+marginLeft}px; min-height: 33px; font: 10px sans-serif;">
  <style>

.${id}-item {
  break-inside: avoid;
  display: flex;
  align-items: center;
  padding-bottom: 1px;
}

.${id}-label {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
  max-width: calc(100% - ${+swatchWidth}px - 0.5em);
}

.${id}-swatch {
  width: ${+swatchWidth}px;
  height: ${+swatchHeight}px;
  margin: 0 0.5em 0 0;
}

  </style>
  <div style="width: 100%; columns: ${columns};">${color.domain().map(value => {
    const label = format(value);
    return html`<div class="${id}-item">
      <div class="${id}-swatch" style="background:${color(value)};"></div>
      <div class="${id}-label" title="${label.replace(/["&]/g, entity)}">${document.createTextNode(label)}</div>
    </div>`;
  })}
  </div>
</div>`;

  return html`<div style="display: flex; align-items: center; min-height: 33px; margin-left: ${+marginLeft}px; font: 10px sans-serif;">
  <style>

.${id} {
  display: inline-flex;
  align-items: center;
  margin-right: 1em;
}

.${id}::before {
  content: "";
  width: ${+swatchWidth}px;
  height: ${+swatchHeight}px;
  margin-right: 0.5em;
  background: var(--color);
}

  </style>
  <div>${color.domain().map(value => html`<span class="${id}" style="--color: ${color(value)}">${document.createTextNode(format(value))}</span>`)}</div>`;
}