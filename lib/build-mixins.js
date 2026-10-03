import { createProp, createMixin } from './utils/helpers.js';
import { PLATFORMS_FOR_MEDIA_QUERIES, PLATFORMS_FOR_KEYFRAMES, KEYFRAME_MIXIN } from './const.js';

// Группы токенов → текст миксинов для каждой платформы (дописывается в конец файла переменных).
// Пустой объект, если групп нет.
export default function buildMixins({ platforms, groups, mediaAliases, keyframesAliases, getName }) {
  if (!groups.length) {
    return {};
  }

  const result = { css: '', less: '\n', scss: '\n' };

  groups.forEach(({ name, category, tokens }) => {
    const isMedia = mediaAliases.includes(category);
    const isAnimation = keyframesAliases.includes(category);

    const props = tokens.reduce((acc, cur) => {
      const propName = cur.path[cur.path.length - 1];
      const propValue = getName ? getName(cur.path) : cur.path.join('-');
      const parentName = cur.path[cur.path.length - 2];
      const prop = createProp(propName, propValue, isMedia, isAnimation);

      Object.keys(prop).forEach((key) => {
        if (Object.prototype.hasOwnProperty.call(acc, key)) {
          if (isAnimation) {
            const isParentNameExist = Object.prototype.hasOwnProperty.call(acc[key], parentName);
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

  return Object.fromEntries(
    platforms.map((platform) => [
      platform,
      platform === 'css' ? result[platform] : KEYFRAME_MIXIN[platform] + result[platform],
    ]),
  );
}
