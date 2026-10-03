import fs from 'node:fs';
import { log, greenLog, redLog, yellowLog } from './logger.js';
import { DEFAULT_OPTIONS, DEFAULT_VALUE } from '../const.js';
import { DictionaryError } from '../tokens/errors.js';
import { RESERVED_THEME_KEYS } from '../tokens/themes.js';

function toStringList(value) {
  return (Array.isArray(value) ? value : [value]).filter((item) => typeof item === 'string' && item.length);
}

// Правила совпадают с schema/config.schema.json.
const checking = {
  platforms: (value) => {
    let result = [];

    toStringList(value).forEach((platform) => {
      if (!DEFAULT_VALUE.platforms.includes(platform)) {
        redLog(`'${platform}' incorrect platform name`);
        return;
      }

      result.push(platform);
    });

    if (!result.length) {
      redLog(
        'List of platforms turned out to be empty after validation. Default value will be used: ',
        DEFAULT_VALUE.platforms,
      );
      result = [...DEFAULT_VALUE.platforms];
    }

    return result;
  },
  source: (value) => {
    const list = toStringList(value);

    if (!list.length) {
      redLog('Folder with your design tokens is not specified. Default value will be used: ', DEFAULT_VALUE.source);
      return [...DEFAULT_VALUE.source];
    }

    return list;
  },
  output: (value) => {
    if (typeof value !== 'string' || !value.length) {
      redLog('Folder for saving the final result is not specified. Default value will be used: ', DEFAULT_VALUE.output);
      return DEFAULT_VALUE.output;
    }

    return value;
  },
  mediaAliases: (value) => {
    const list = toStringList(value);

    if (!list.length) {
      redLog(
        'List of aliases for media queries turned out to be empty. Default value will be used: ',
        DEFAULT_VALUE.mediaAliases,
      );
      return [...DEFAULT_VALUE.mediaAliases];
    }

    return list;
  },
  keyframesAliases: (value) => {
    const list = toStringList(value);

    if (!list.length) {
      redLog(
        'List of aliases for keyframes turned out to be empty. Default value will be used: ',
        DEFAULT_VALUE.keyframesAliases,
      );
      return [...DEFAULT_VALUE.keyframesAliases];
    }

    return list;
  },
  numberUnit: (value) => {
    if (value === false || value === 'px' || value === 'rem') {
      return value;
    }

    redLog(`numberUnit must be "px", "rem" or false. Default value will be used: `, DEFAULT_VALUE.numberUnit);
    return DEFAULT_VALUE.numberUnit;
  },
  dimensionAliases: (value) => {
    const list = toStringList(value);

    if (!list.length) {
      redLog(
        'List of dimension aliases turned out to be empty. Default value will be used: ',
        DEFAULT_VALUE.dimensionAliases,
      );
      return [...DEFAULT_VALUE.dimensionAliases];
    }

    return list;
  },
  themes: (value) => {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value !== 'object' || Array.isArray(value)) {
      redLog('themes must be an object: { "light": [...], "dark": [...] }');
      return null;
    }

    const result = {};

    Object.entries(value).forEach(([name, files]) => {
      if (RESERVED_THEME_KEYS.has(name)) {
        return;
      }

      if (!Array.isArray(files) || !files.length || files.some((file) => typeof file !== 'string')) {
        redLog(`themes.${name} must be a non-empty array of file paths`);
        return;
      }

      result[name] = files;
    });

    if (!Object.keys(result).length) {
      return null;
    }

    // Тема по умолчанию: значения в :root. Без неё — `light` (базовые токены, если файлов light нет).
    if (value.default !== undefined) {
      if (typeof value.default !== 'string' || !(value.default in result || value.default === 'light')) {
        throw new DictionaryError(
          `themes.default must be the name of one of the themes: ${Object.keys(result).join(', ')}`,
        );
      }

      result.default = value.default;
    }

    return result;
  },
};

function readConfigFile(configPath) {
  if (!fs.existsSync(configPath)) {
    throw new DictionaryError(`Config file not found: ${configPath}`);
  }

  let config;

  try {
    config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
  } catch (error) {
    throw new DictionaryError(`Invalid JSON in config file ${configPath}: ${error.message}`);
  }

  if (!config || typeof config !== 'object' || Array.isArray(config)) {
    throw new DictionaryError(`Config file ${configPath} must contain a JSON object`);
  }

  return config;
}

// Проверяет конфиг и подставляет значения по умолчанию. Исходный объект не меняется.
function normalizeConfig(input) {
  log('Start checking config');

  const config = { ...input };
  const known = new Set(['$schema', ...DEFAULT_OPTIONS.map(({ value }) => value)]);

  Object.keys(config)
    .filter((key) => !known.has(key))
    .forEach((key) => yellowLog(`Unknown config option "${key}" is ignored`));

  DEFAULT_OPTIONS.forEach(({ name, value, optional }) => {
    if (!Object.prototype.hasOwnProperty.call(config, value)) {
      if (!optional) {
        redLog(`${name} empty value. Default value will be used: `, DEFAULT_VALUE[value]);
      }
      config[value] = DEFAULT_VALUE[value];
    }

    config[value] = checking[value](config[value]);
  });

  greenLog('Config check completed successfully');

  return config;
}

export default function getConfig(configPath = './config.json') {
  return normalizeConfig(readConfigFile(configPath));
}

export { readConfigFile, normalizeConfig };
