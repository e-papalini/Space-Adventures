/** Text is assigned through textContent, including future user-authored data. */
export function element(tag, text, className) {
  const node = document.createElement(tag);
  if (text !== undefined) node.textContent = text;
  if (className) node.className = className;
  return node;
}

export function button(text, onClick) {
  const node = element('button', text);
  node.type = 'button';
  node.addEventListener('click', onClick);
  return node;
}
