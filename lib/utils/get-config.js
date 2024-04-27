import fs from 'fs-extra';
import { log, greenLog, redLog } from './logger.js';
import { DEFAULT_OPTIONS, DEFAULT_VALUE } from '../const.js';
import { checkingPlatforms, checkingOutput, checkingMediaAliases } from './checking-options.js';

export default function getConfig(options) {
  log('Start checking config');

  let check = true;
  let configPath = options.config;

  if (!configPath) {
    if (fs.existsSync('./config.json')) {
      configPath = './config.json';
    } else {
      check = false;
    }
  }

  const config = fs.readJsonSync(configPath);

  DEFAULT_OPTIONS.forEach(({ name, value }) => {
    if (!config.hasOwnProperty(value)) {
      redLog(`${name} empty value. Default value will be used: `, DEFAULT_VALUE[value]);
      config[value] = DEFAULT_VALUE[value];
    }
  });

  const result = {
    platforms: checkingPlatforms(config.platforms),
    source: config.source,
    output: checkingOutput(config.output),
    mediaAliases: checkingMediaAliases(config.mediaAliases),
  };

  if (!config.source.length || config.source.every((item) => !item.length)) {
    redLog('Folder with your design tokens is not specified');
    check = false;
  }

  if (check) {
    greenLog('Config check completed successfully');
  }

  return {
    check,
    ...result,
  };
}
