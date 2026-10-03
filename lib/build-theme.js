import { renderOverrides, renderRoot } from './tokens/theme-blocks.js';

const pathName = (path) => path.join('-');

function toVars(tokens, getName) {
  return tokens.map((token) => ({ name: `--${getName(token.path)}`, value: token.value }));
}

function escapeRegExp(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// В :root — только семантические токены со значениями темы по умолчанию.
function getThemeParts(resolved, getName) {
  const overrides = resolved.themes.filter(({ tokens }) => tokens.length);

  if (!overrides.length) {
    return null;
  }

  const overridden = new Set(overrides.flatMap(({ tokens }) => tokens.map((token) => token.path.join('.'))));
  const defaultVars = toVars(
    resolved.tokens.filter((token) => overridden.has(token.path.join('.'))),
    getName,
  );

  return {
    tokens: overrides.flatMap(({ tokens }) => tokens),
    root: renderRoot(defaultVars),
    blocks: renderOverrides({
      defaultName: resolved.defaultName,
      defaultVars,
      themes: overrides.map(({ name, tokens }) => ({ name, vars: toVars(tokens, getName) })),
    }),
  };
}

// LESS/SCSS: семантические переменные ссылаются на CSS-переменные (var()), чтобы тема переключалась
// в рантайме. Остальные (palette, screen, size и т. д.) остаются с реальными значениями —
// var() не работает внутри @media, поэтому брейкпоинт-миксины должны использовать конкретные значения.
function rewritePreprocessor(content, platform, { tokens, root, blocks }, getName) {
  const prefix = platform === 'less' ? '@' : '$';
  const names = [...new Set(tokens.map((token) => getName(token.path)))];

  const result = names.reduce(
    (acc, varName) =>
      acc.replace(
        new RegExp(`^${escapeRegExp(prefix)}${escapeRegExp(varName)}:.*?;`, 'm'),
        `${prefix}${varName}: var(--${varName});`,
      ),
    content,
  );

  return root + blocks + '\n' + result;
}

// Добавляет к файлам платформ блоки тем: CSS — в конец, LESS/SCSS — :root и блоки в начало.
export default function buildTheme({ files, platforms, resolved, getName = pathName }) {
  const parts = getThemeParts(resolved, getName);

  if (!parts) {
    return files;
  }

  return Object.fromEntries(
    platforms.map((platform) => {
      const content = files[platform];
      return [
        platform,
        platform === 'css' ? content + parts.blocks : rewritePreprocessor(content, platform, parts, getName),
      ];
    }),
  );
}
