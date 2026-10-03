# Фикстуры snapshot-тестов

Каждая папка — отдельный кейс: `config.json`, `tokens/` и эталон `expected/` (то, что сборка пишет в `output`).
Тест (`test/build.test.js`) собирает кейс во временную папку и сравнивает файлы с `expected/` побайтно.

| Кейс | Что проверяет |
| --- | --- |
| `pbstyles` | токены pbstyles в старом формате (`value` + `mixin`), CSS/LESS/SCSS, светлая и тёмная тема |
| `pbstyles-dtcg` | те же токены в строгом DTCG 2025.10 — `expected/` совпадает с `pbstyles` байт в байт |
| `readme` | пример из README без тем |
| `themes` | минимальный пример тем (CSS и SCSS) |
| `multi-theme` | три темы и `themes.default` |
| `dtcg-composite` | составные типы DTCG: typography, shadow, color, группы без `mixin`, `$extensions` |
| `direct-source` | путь к файлу в `source` (B4) |
| `camel-case` | camelCase в пути: миксин и блоки тем ссылаются на имена переменных Style Dictionary |
| `typography-reference` | DTCG-токен typography со ссылкой на другой typography-токен |
| `figma-export` | выгрузка переменных Figma: цвет объектом, `$extensions` Figma, `number` в размерных категориях → `px`, `font-weight`/`opacity` без единицы |

Вывод старого формата совпадает с версией 1.4.2 байт в байт (кроме `camel-case`: в 1.4.2 там были ссылки на несуществующие переменные).

Как добавить кейс: создайте папку с `config.json` (`"output": "./expected"`) и `tokens/`,
выполните в ней `node ../../../bin/mixin-dictionary.js -c config.json`, проверьте `expected/` глазами
и запустите `npm test`.
