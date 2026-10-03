// Чистая генерация CSS/LESS/SCSS: без fs, path и process — работает и в браузере.
// Файлы читает и пишет lib/index.js (build).

import StyleDictionary from 'style-dictionary';
import buildMixins from './build-mixins.js';
import buildTheme from './build-theme.js';
import { DEFAULT_VALUE } from './const.js';
import { DictionaryError } from './tokens/errors.js';
import { getGroups } from './tokens/groups.js';
import { normalizeValue, TYPOGRAPHY_TYPES } from './tokens/normalize-value.js';
import { applyNumberUnit } from './tokens/number-unit.js';
import { kebabCase } from './tokens/read-tokens.js';
import { isPlainObject, isToken } from './tokens/walk.js';
import { resolveThemes, defaultLogger } from './tokens/resolve.js';

const DTCG_VALUE_TRANSFORM = 'mixin-dictionary/dtcg-value';

// Значения DTCG (объекты dimension/color/shadow, массивы fontFamily) → строки CSS,
// как в tailwind-dictionary. Старый формат идёт через transformGroup платформы, как раньше.
// Голые числа в размерных категориях получают единицу (number-unit.js).
function createHooks(units) {
  return {
    transforms: {
      [DTCG_VALUE_TRANSFORM]: {
        type: 'value',
        transitive: true,
        filter: (token) => token.$value !== undefined,
        transform: (token) =>
          applyNumberUnit(normalizeValue(token.$value, token.$type), { type: token.$type, path: token.path }, units),
      },
    },
  };
}

function getPlatformsConfig(platforms, usesDtcg) {
  return Object.fromEntries(
    platforms.map((platform) => [
      platform,
      {
        ...(usesDtcg
          ? {
              transforms: ['attribute/cti', 'name/kebab', DTCG_VALUE_TRANSFORM],
            }
          : { transformGroup: platform }),
        files: [{ format: `${platform}/variables`, destination: `index.${platform}` }],
      },
    ]),
  );
}

const REFERENCE = /^\{([^{}]+)\}$/;

function getNode(tree, path) {
  return path.reduce((node, key) => (isPlainObject(node) ? node[key] : undefined), tree);
}

// Значение составной типографики; ссылку на другой typography-токен (`"{font.h1}"`) разворачивает по цепочке.
function getTypographyValue(tree, value, seen = new Set()) {
  const match = typeof value === 'string' ? REFERENCE.exec(value) : null;

  if (!match || seen.has(match[1])) {
    return { value };
  }

  seen.add(match[1]);
  const target = getNode(tree, match[1].split('.'));
  const resolved = isToken(target) ? getTypographyValue(tree, target.$value, seen) : { value };

  return { value: resolved.value, reference: resolved.reference ?? match[1] };
}

// Составная типографика DTCG → группа подтокенов `<path>.font-size`, `<path>.line-height`, … на том же месте
// дерева: переменные получают те же имена и порядок, что у старых токенов с полем `mixin`.
// Токен-ссылка на другую типографику разворачивается в ссылки на её подтокены (`{font.h1.font-size}`).
function expandTypography(tree, root = tree, inheritedType = undefined) {
  if (!isPlainObject(tree)) {
    return tree;
  }

  return Object.fromEntries(
    Object.entries(tree).map(([key, node]) => {
      if (key.startsWith('$') || !isPlainObject(node)) {
        return [key, node];
      }

      const type = node.$type ?? inheritedType;

      if (isToken(node) && type === 'typography') {
        const { value, reference } = getTypographyValue(root, node.$value);

        if (isPlainObject(value)) {
          const group = Object.fromEntries(
            Object.entries(value).map(([prop, subValue]) => [
              kebabCase(prop),
              {
                $type: TYPOGRAPHY_TYPES[prop] ?? 'other',
                $value: reference ? `{${reference}.${kebabCase(prop)}}` : subValue,
              },
            ]),
          );
          return [key, group];
        }
      }

      return [key, isToken(node) ? node : expandTypography(node, root, type)];
    }),
  );
}

// Файлы переменных через форматы Style Dictionary, в памяти.
async function buildVariables({ tree, platforms, usesDtcg, units }) {
  const sd = new StyleDictionary({
    tokens: structuredClone(usesDtcg ? expandTypography(tree) : tree),
    hooks: createHooks(units),
    platforms: getPlatformsConfig(platforms, usesDtcg),
    log: { verbosity: 'silent', warnings: 'disabled' },
  });

  const files = {};

  for (const platform of platforms) {
    try {
      const [file] = await sd.formatPlatform(platform);
      files[platform] = file.output;
    } catch (error) {
      throw new DictionaryError(`Unable to build ${platform} variables: ${String(error.message).trim()}`);
    }
  }

  // Имена переменных (name/kebab у всех платформ): миксины и блоки тем ссылаются на них же,
  // поэтому путь `screen.tabletUp.min` даёт `$screen-tablet-up-min` и в переменной, и в миксине.
  const { allTokens } = await sd.getPlatformTokens(platforms[0]);
  const names = new Map(allTokens.map((token) => [token.path.join('.'), token.name]));

  return { files, names };
}

// Имя переменной токена; для путей, которых нет в теме по умолчанию, — путь через дефис, как раньше.
function createNameResolver(names) {
  return (path) => names.get(path.join('.')) ?? path.join('-');
}

/**
 * Генерирует переменные, миксины и темы из деревьев токенов.
 *
 * @param {import('./types.js').GenerateOptions} options
 * @returns {Promise<Record<string, string>>} содержимое файлов по путям относительно `output`:
 *   `css/index.css`, `less/index.less`, `scss/index.scss` (по списку `platforms`).
 */
async function generate({
  tokens,
  themes = null,
  platforms = DEFAULT_VALUE.platforms,
  mediaAliases = DEFAULT_VALUE.mediaAliases,
  keyframesAliases = DEFAULT_VALUE.keyframesAliases,
  numberUnit = DEFAULT_VALUE.numberUnit,
  dimensionAliases = DEFAULT_VALUE.dimensionAliases,
  sources,
  logger = defaultLogger,
}) {
  const unknown = platforms.filter((platform) => !DEFAULT_VALUE.platforms.includes(platform));

  if (unknown.length) {
    throw new DictionaryError(`Unknown platforms: ${unknown.join(', ')}. Use ${DEFAULT_VALUE.platforms.join(', ')}`);
  }

  // Брейкпоинты (`screen.lg.min: 768`) — тоже размеры.
  const units = { numberUnit, dimensionAliases: [...new Set([...dimensionAliases, ...mediaAliases])] };

  const resolved = await resolveThemes({ tokens: tokens ?? {}, themes, sources, logger, units });
  const variables = await buildVariables({
    tree: resolved.tree,
    platforms,
    usesDtcg: resolved.usesDtcg,
    units,
  });
  const getName = createNameResolver(variables.names);

  const groups = getGroups(resolved.tokens, {
    media: mediaAliases.map((alias) => [alias]),
    keyframes: keyframesAliases.map((alias) => [alias]),
  });

  if (!groups.length) {
    logger.warn('Mixins not found: no tokens with "mixin", typography, breakpoints or keyframes');
  }

  const mixins = buildMixins({ platforms, groups, mediaAliases, keyframesAliases, getName });
  const withMixins = Object.fromEntries(
    platforms.map((platform) => [platform, variables.files[platform] + (mixins[platform] ?? '')]),
  );
  const withThemes = buildTheme({ files: withMixins, platforms, resolved, getName });

  return Object.fromEntries(platforms.map((platform) => [`${platform}/index.${platform}`, withThemes[platform]]));
}

export { generate };
export default generate;
