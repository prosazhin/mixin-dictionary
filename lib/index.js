import fs from 'node:fs';
import path from 'node:path';
import { generate } from './generate.js';
import getConfig, { normalizeConfig } from './utils/get-config.js';
import { readTokenFiles, requireFiles } from './utils/read-token-files.js';
import { cliLogger, divider, greenLog, log } from './utils/logger.js';
import { RESERVED_THEME_KEYS } from './tokens/themes.js';

// `build({ config: './config.json' })` (как передаёт CLI) или `build({ source, output, … })`.
function resolveConfig(options = {}) {
  const isFileOptions = typeof options.config === 'string' && !('source' in options) && !('platforms' in options);
  return isFileOptions ? getConfig(options.config) : normalizeConfig(options);
}

// Файлы конфига → деревья токенов для generate().
async function loadTokens({ source, themes }) {
  const sources = new Map();
  const { tree } = await readTokenFiles(requireFiles(source), sources);

  if (!themes) {
    return { tokens: tree, themes: null, sources };
  }

  const themeTrees = {};

  for (const [name, files] of Object.entries(themes)) {
    if (RESERVED_THEME_KEYS.has(name)) {
      themeTrees[name] = files;
    } else {
      themeTrees[name] = (await readTokenFiles(requireFiles(files, `token files for theme "${name}"`), sources)).tree;
    }
  }

  return { tokens: tree, themes: themeTrees, sources };
}

function writeFiles(output, files) {
  Object.entries(files).forEach(([file, content]) => {
    const target = path.join(output, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, content);
    log(`✔︎ ${target}`);
  });
}

/**
 * Читает файлы токенов, генерирует CSS/LESS/SCSS и записывает их в `output`.
 *
 * @param {import('./types.js').BuildOptions} [options] конфиг или `{ config: 'path/to/config.json' }`
 * @returns {Promise<Record<string, string>>} записанные файлы (пути относительно `output`)
 */
async function build(options = {}) {
  const config = resolveConfig(options);

  divider('\n', '\n');

  const { tokens, themes, sources } = await loadTokens(config);

  log('Start building variables, mixins and themes');

  const files = await generate({
    tokens,
    themes,
    platforms: config.platforms,
    mediaAliases: config.mediaAliases,
    keyframesAliases: config.keyframesAliases,
    numberUnit: config.numberUnit,
    dimensionAliases: config.dimensionAliases,
    sources,
    logger: cliLogger,
  });

  writeFiles(config.output, files);

  greenLog('Build completed successfully');

  return files;
}

export { build, generate };
export default build;
