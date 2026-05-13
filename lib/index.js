import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import StyleDictionary from 'style-dictionary';
import buildMixins from './build-mixins.js';
import buildTheme from './build-theme.js';
import getConfig from './utils/get-config.js';
import getSemanticPaths from './utils/get-semantic-paths.js';
import { getTokens } from './utils/helpers.js';
import { divider } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

function buildPlatformsConfig(platforms, output) {
  const config = {};

  platforms.forEach((platform) => {
    config[platform] = {
      transformGroup: platform,
      buildPath: `${output}/${platform}/`,
      files: [{ format: `${platform}/variables`, destination: `index.${platform}` }],
    };
  });

  return config;
}

export default async function build(options) {
  const { platforms, source, output, themes, mediaAliases, keyframesAliases } = getConfig(options);
  const mixinsConfig = { platforms, output, mediaAliases, keyframesAliases, __dirname };

  divider('\n', '');

  const lightSource = themes?.light ? [...source, ...themes.light] : source;

  const lightBuildConfig = {
    source: lightSource,
    platforms: {
      js: {
        transformGroup: 'js',
        buildPath: `${join(__dirname, '..')}/cache/`,
        files: [{ format: 'javascript/module', destination: 'index.cjs' }],
      },
      ...buildPlatformsConfig(platforms, output),
    },
  };

  const sdLight = new StyleDictionary(lightBuildConfig);
  await sdLight.buildAllPlatforms();

  // Читаем light токены до того, как buildMixins удалит кэш
  let lightTokens = [];
  if (themes?.dark) {
    const lightCachePath = join(__dirname, '..', 'cache', 'index.cjs');
    const lightVariables = await import(lightCachePath);
    lightTokens = getTokens(lightVariables.default);
  }

  divider('\n', '\n');

  await buildMixins(mixinsConfig);

  if (themes?.dark) {
    const darkSource = [...source, ...themes.dark];
    const semanticPaths = getSemanticPaths(themes.dark);

    const darkBuildConfig = {
      source: darkSource,
      platforms: {
        js: {
          transformGroup: 'js',
          buildPath: `${join(__dirname, '..')}/cache-dark/`,
          files: [{ format: 'javascript/module', destination: 'index.cjs' }],
        },
      },
    };

    const sdDark = new StyleDictionary(darkBuildConfig);
    await sdDark.buildAllPlatforms();

    await buildTheme({ platforms, output, lightTokens, semanticPaths, __dirname });
  }
}
