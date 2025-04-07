import fs from 'fs-extra';
import { join } from 'path';
import { getTokens, getMixins, createProp, createMixin } from './utils/helpers.js';
import { PLATFORMS_FOR_MEDIA_QUERIES, PLATFORMS_FOR_KEYFRAMES, KEYFRAME_MIXIN } from './const.js';
import { log, greenLog, redLog } from './utils/logger.js';

export default async function buildMixins({ platforms, output, mediaAliases, keyframesAliases, __dirname }) {
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

      const result = { css: '', less: '\n', scss: '\n' };

      mixins.forEach(({ name, category, tokens }) => {
        const isMedia = mediaAliases.includes(category);
        const isAnimation = keyframesAliases.includes(category);

        const props = tokens.reduce((acc, cur) => {
          const propName = cur.path[cur.path.length - 1];
          const propValue = cur.path.join('-');
          const parentName = cur.path[cur.path.length - 2];
          const prop = createProp(propName, propValue, isMedia, isAnimation);

          Object.keys(prop).forEach((key) => {
            if (acc.hasOwnProperty(key)) {
              if (isAnimation) {
                const isParentNameExist = acc[key].hasOwnProperty(parentName);
                const accKeyValue = acc[key];
                const parentKeyValue = isParentNameExist ? accKeyValue[parentName] : [];

                return (acc[key] = {
                  ...acc[key],
                  [parentName]: [...parentKeyValue, prop[key]],
                });
              }

              return acc[key].push(prop[key]);
            }

            if (isAnimation) {
              return (acc[key] = {
                [parentName]: [prop[key]],
              });
            }

            acc[key] = [prop[key]];
          });

          return acc;
        }, {});

        const mixin = createMixin(name, props, isMedia, isAnimation);

        platforms.forEach((platform) => {
          const isCss = platform === 'css';

          if (
            (isMedia && !PLATFORMS_FOR_MEDIA_QUERIES.includes(platform)) ||
            (isAnimation && !PLATFORMS_FOR_KEYFRAMES.includes(platform)) ||
            isCss
          ) {
            return;
          }

          result[platform] += mixin[platform];
        });
      });

      platforms.forEach((platform) => {
        if (platform === 'css') {
          fs.appendFileSync(`${output}/${platform}/index.${platform}`, result[platform]);
        } else {
          fs.appendFileSync(`${output}/${platform}/index.${platform}`, KEYFRAME_MIXIN[platform] + result[platform]);
        }
      });

      greenLog('Mixins build completed successfully');
    }
  }

  fs.removeSync(join(__dirname, '..', 'cache'));
}
