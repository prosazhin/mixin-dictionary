// Типы публичного API (JSDoc). Из них `tsc` собирает `types/*.d.ts` перед публикацией.

/**
 * Дерево дизайн-токенов: старый формат (`value`) или DTCG (`$value`, `$type`).
 * @typedef {{ [key: string]: any }} TokenTree
 */

/**
 * Темы в конфиге: имя темы → файлы токенов, плюс необязательный `default`.
 * @typedef {{ default?: string, [theme: string]: string[] | string | undefined }} ThemesConfig
 */

/**
 * Темы для generate(): имя темы → дерево токенов, плюс необязательный `default`.
 * @typedef {{ default?: string, [theme: string]: TokenTree | string | undefined }} ThemesTokens
 */

/**
 * Получатель предупреждений (по умолчанию — console.warn).
 * @typedef {{ warn: (message: string) => void }} Logger
 */

/**
 * Платформа: CSS-переменные, LESS или SCSS (переменные и миксины).
 * @typedef {'css' | 'less' | 'scss'} Platform
 */

/**
 * Конфиг mixin-dictionary (то же, что в config.json).
 * @typedef {object} Config
 * @property {Platform[]} [platforms] Платформы. По умолчанию `["css", "less", "scss"]`.
 * @property {string[]} [source] Глобы или пути к файлам токенов. По умолчанию `["tokens/**\/*.json"]`.
 * @property {string} [output] Папка для результата. По умолчанию `"./styles"`.
 * @property {string[]} [mediaAliases] Категории брейкпоинтов. По умолчанию `["screen", "breakpoint"]`.
 * @property {string[]} [keyframesAliases] Категории keyframes. По умолчанию `["keyframes"]`.
 * @property {ThemesConfig | null} [themes] Файлы тем (`light`, `dark`, …) и `default`.
 */

/**
 * Параметры build(): конфиг целиком или путь к config.json.
 * @typedef {Config | { config: string }} BuildOptions
 */

/**
 * Параметры generate().
 * @typedef {object} GenerateOptions
 * @property {TokenTree} tokens Базовые токены.
 * @property {ThemesTokens | null} [themes] Токены тем и `default`.
 * @property {Platform[]} [platforms] Платформы. По умолчанию `["css", "less", "scss"]`.
 * @property {string[]} [mediaAliases] Категории брейкпоинтов. По умолчанию `["screen", "breakpoint"]`.
 * @property {string[]} [keyframesAliases] Категории keyframes. По умолчанию `["keyframes"]`.
 * @property {Map<string, string>} [sources] Путь токена (`a.b.c`) → файл: для сообщений об ошибках.
 * @property {Logger} [logger] Куда писать предупреждения.
 */

export {};
