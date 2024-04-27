import { redLog } from './logger.js';
import { DEFAULT_VALUE } from '../const.js';

function checkingPlatforms(platforms) {
  const result = [];

  if (platforms.length) {
    platforms.forEach((platform) => {
      const platformCheck = DEFAULT_VALUE.platforms.includes(platform);

      if (!platformCheck) {
        redLog(`'${platform}' incorrect platform name`);
        return;
      }

      result.push(platform);
    });
  }

  if (!result.length) {
    redLog(
      'List of platforms turned out to be empty after validation. Default value will be used: ',
      DEFAULT_VALUE.platforms,
    );
    return DEFAULT_VALUE.platforms;
  }

  return result;
}

function checkingOutput(output) {
  if (!output.length) {
    redLog('Folder for saving the final result is not specified. Default value will be used: ', DEFAULT_VALUE.output);
    return DEFAULT_VALUE.output;
  }

  return output;
}

function checkingMediaAliases(mediaAliases) {
  if (!mediaAliases.length || mediaAliases.every((item) => !item.length)) {
    redLog(
      'List of aliases for media queries turned out to be empty. Default value will be used: ',
      DEFAULT_VALUE.mediaAliases,
    );
    return DEFAULT_VALUE.mediaAliases;
  }

  return mediaAliases;
}

export { checkingPlatforms, checkingOutput, checkingMediaAliases };
