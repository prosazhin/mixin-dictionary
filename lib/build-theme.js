import fs from 'fs-extra';
import { join } from 'path';
import { getTokens } from './utils/helpers.js';
import { greenLog } from './utils/logger.js';

export default async function buildTheme({ platforms, output, lightTokens, semanticPaths, __dirname }) {
  const cachePath = join(__dirname, '..', 'cache-dark', 'index.cjs');

  if (!fs.existsSync(cachePath)) {
    return;
  }

  const variables = await import(cachePath);
  const allTokens = getTokens(variables.default);
  const darkTokens = allTokens.filter((token) => semanticPaths.has(token.path.join('.')));

  if (!darkTokens.length) {
    fs.removeSync(join(__dirname, '..', 'cache-dark'));
    return;
  }

  try {
    platforms.forEach((platform) => {
      if (platform === 'css') {
        appendCssDark({ output, lightTokens, darkTokens });
      } else {
        rewritePreprocessorWithThemes({ output, platform, lightTokens, darkTokens });
      }
    });

    greenLog('Dark theme build completed successfully');
  } finally {
    fs.removeSync(join(__dirname, '..', 'cache-dark'));
  }
}

function buildVarsString(tokens, indent) {
  return tokens.map((token) => `${indent}--${token.path.join('-')}: ${token.value};`).join('\n') + '\n';
}

// Системная тёмная тема применяется только пока на :root не задан data-theme='light' —
// иначе светлую тему нельзя было бы включить принудительно на устройстве с тёмной схемой.
// Блок [data-theme='light'] нужен для светлых контейнеров внутри тёмной страницы.
// В lightVars только семантические токены (те что есть в darkTokens).
function buildThemeBlocks({ lightTokens, darkTokens }) {
  const darkVarNames = new Set(darkTokens.map((t) => t.path.join('-')));
  const semanticLightTokens = lightTokens.filter((t) => darkVarNames.has(t.path.join('-')));

  const lightVars = buildVarsString(semanticLightTokens, '  ');
  const darkVars4 = buildVarsString(darkTokens, '    ');
  const darkVars2 = buildVarsString(darkTokens, '  ');

  const blocks =
    `\n@media (prefers-color-scheme: dark) {\n  :root:not([data-theme='light']) {\n${darkVars4}  }\n}\n` +
    `\n[data-theme='dark'] {\n${darkVars2}}\n` +
    `\n[data-theme='light'] {\n${lightVars}}\n`;

  return { lightVars, blocks };
}

function appendCssDark({ output, lightTokens, darkTokens }) {
  const { blocks } = buildThemeBlocks({ lightTokens, darkTokens });

  fs.appendFileSync(`${output}/css/index.css`, blocks);
}

function rewritePreprocessorWithThemes({ output, platform, lightTokens, darkTokens }) {
  const ext = platform;
  const prefix = platform === 'less' ? '@' : '$';
  const escapedPrefix = platform === 'scss' ? '\\$' : '@';
  const filePath = `${output}/${platform}/index.${ext}`;

  if (!fs.existsSync(filePath)) {
    return;
  }

  let content = fs.readFileSync(filePath, 'utf8');

  // Заменяем на var() только семантические токены (те что меняются между темами).
  // Остальные (palette, screen, size и т.д.) оставляем с реальными значениями —
  // var() не работает внутри @media запросов, поэтому брейкпоинт-миксины должны
  // использовать конкретные значения.
  darkTokens.forEach((token) => {
    const varName = token.path.join('-');
    content = content.replace(
      new RegExp(`^${escapedPrefix}${varName}:.*?;`, 'm'),
      `${prefix}${varName}: var(--${varName});`,
    );
  });

  // В :root только семантические токены со значениями светлой темы —
  // остальные не нужны, они живут как реальные значения в LESS/SCSS переменных
  const { lightVars, blocks } = buildThemeBlocks({ lightTokens, darkTokens });
  const prepend = `:root {\n${lightVars}}\n` + blocks + '\n';

  fs.writeFileSync(filePath, prepend + content);
}
