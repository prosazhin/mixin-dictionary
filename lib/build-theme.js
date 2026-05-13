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
        appendCssDark({ output, darkTokens });
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

function appendCssDark({ output, darkTokens }) {
  const darkVars4 = buildVarsString(darkTokens, '    ');
  const darkVars2 = buildVarsString(darkTokens, '  ');

  const mediaBlock = `\n@media (prefers-color-scheme: dark) {\n  :root {\n${darkVars4}  }\n}\n`;
  const selectorBlock = `\n[data-theme='dark'] {\n${darkVars2}}\n`;

  fs.appendFileSync(`${output}/css/index.css`, mediaBlock + selectorBlock);
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
  const darkVarNames = new Set(darkTokens.map((t) => t.path.join('-')));
  const semanticLightTokens = lightTokens.filter((t) => darkVarNames.has(t.path.join('-')));
  const lightVars = buildVarsString(semanticLightTokens, '  ');

  // CSS custom properties для тёмной темы
  const darkVars4 = buildVarsString(darkTokens, '    ');
  const darkVars2 = buildVarsString(darkTokens, '  ');

  let prepend = `:root {\n${lightVars}}\n`;
  prepend += `\n@media (prefers-color-scheme: dark) {\n  :root {\n${darkVars4}  }\n}\n`;
  prepend += `\n[data-theme='dark'] {\n${darkVars2}}\n\n`;

  fs.writeFileSync(filePath, prepend + content);
}
