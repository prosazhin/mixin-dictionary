import fs from 'fs-extra';
import { join } from 'path';
import getTokens from './utils/get-tokens.js';
import getMixins from './utils/get-mixins.js';
import { createProp, createMixin } from './utils/create-mixin.js';
import { PLATFORMS_FOR_MEDIA_QUERIES } from './const.js';
import { log, greenLog, redLog } from './utils/logger.js';

export default async function buildMixins({ platforms, output, mediaAliases, __dirname }) {
  const cachePath = join(__dirname, '..', 'cache', 'index.cjs');

  if (fs.existsSync(cachePath)) {
    const variables = await import(cachePath);
    const allTokenList = getTokens(variables.default);
    const mixins = getMixins(allTokenList.filter((token) => token.hasOwnProperty('mixin')));

    if (!mixins.length) {
      redLog('Build completed with an error, mixins not found');
    }

    if (mixins.length) {
      log('Start building mixins');

      const result = {
        css: '',
        less: '\n',
        scss: '\n',
      };

      mixins.forEach(({ name, category, tokens }) => {
        const isMedia = mediaAliases.includes(category);

        const props = tokens.reduce((acc, cur) => {
          const propName = cur.path[cur.path.length - 1];
          const propValue = cur.path.join('-');
          const prop = createProp(propName, propValue, isMedia);

          Object.keys(prop).forEach((key) => {
            if (acc.hasOwnProperty(key)) {
              return acc[key].push(prop[key]);
            }

            acc[key] = [prop[key]];
          });

          return acc;
        }, {});

        const mixin = createMixin(name, props, isMedia);

        platforms.forEach((platform) => {
          const isCss = platform === 'css';

          if ((isMedia && !PLATFORMS_FOR_MEDIA_QUERIES.includes(platform)) || isCss) {
            return;
          }

          result[platform] += mixin[platform];
        });
      });

      platforms.forEach((platform) => {
        fs.appendFileSync(`${output}/${platform}/index.${platform}`, result[platform]);
      });

      greenLog('Mixins build completed successfully');
    }
  }

  fs.removeSync(join(__dirname, '..', 'cache'));
}
