/**
 * Escapes HTML string to prevent XSS attacks
 */
export function escapeHTML(str) {
  if (typeof str !== 'string') return str == null ? '' : String(str);
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

/**
 * Element selector shorthand
 */
export function $(selector, context = document) {
  return context.querySelector(selector);
}

/**
 * All elements selector shorthand
 */
export function $$(selector, context = document) {
  return Array.from(context.querySelectorAll(selector));
}
