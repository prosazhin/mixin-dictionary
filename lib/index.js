import { dirname, join } from 'path';
import { fileURLToPath } from 'url';
import StyleDictionary from 'style-dictionary';
import buildMixins from './build-mixins.js';
import getConfig from './utils/get-config.js';
import { divider } from './utils/logger.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

export default async function build(options) {
  const { platforms, source, output, mediaAliases } = getConfig(options);
  const config = { platforms, source, output, mediaAliases, __dirname };

  divider('\n', '');

  const buildConfig = {
    source: source,
    platforms: {
      js: {
        transformGroup: 'js',
        buildPath: `${join(__dirname, '..')}/cache/`,
        files: [
          {
            format: 'javascript/module',
            destination: 'index.cjs',
          },
        ],
      },
    },
  };

  platforms.forEach((platform) => {
    buildConfig.platforms[platform] = {
      transformGroup: platform,
      buildPath: `${output}/${platform}/`,
      files: [
        {
          format: `${platform}/variables`,
          destination: `index.${platform}`,
        },
      ],
    };
  });

  const sd = new StyleDictionary(buildConfig);
  await sd.buildAllPlatforms();

  divider('\n', '\n');

  await buildMixins(config);
}
