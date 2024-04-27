import { join } from 'path';
import StyleDictionary from 'style-dictionary';
import { divider } from './utils/logger.js';

export default async function buildTokens({ platforms, source, output, __dirname }) {
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
}
