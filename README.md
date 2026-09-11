# NickHub

Find available FACEIT nicknames and names eligible for Idle Nickname Claim.
An unofficial browser extension with a dedicated search tab. The interface is currently in Russian.

[English](#english) · [Русский](#русский) · [Twitch](https://www.twitch.tv/kr1nzzzz)

## English

### Features

- Filter by length, contained text, prefix, suffix, letters and digits.
- Choose available names, Idle Nickname Claim, or both.
- Copy names and bookmark results during the current session.
- Fresh availability checks, progress updates and a stop button.
- Up to two concurrent checks, with automatic pauses when FACEIT limits requests.

### Install

1. Download the repository using **Code → Download ZIP**, then extract it.
2. Open `chrome://extensions` in Chrome, or `edge://extensions` in Edge.
3. Enable **Developer mode** and choose **Load unpacked**.
4. Select the extracted folder that contains `manifest.json`, not its parent folder.
5. Open NickHub from your browser's extensions menu.

Chrome has been tested by the developer. Edge and Yandex Browser require separate compatibility testing. Firefox is not supported by this build.

### Use

1. Open [FACEIT](https://www.faceit.com/) in the **same browser and profile**, then sign in. Keep that tab open; it may stay in the background.
2. Open NickHub and set your filters. For example, length **4** and contains **503** generates 72 candidates using letters and digits.
3. Select the availability types and click **Найти никнеймы** (Find nicknames).
4. Use **Остановить поиск** (Stop search) to stop. Requests already in flight may finish.
5. Use the individual check field to check one nickname.

Availability is only valid at the time of the check. Broad searches inspect a limited sample of up to 120 candidates, not every possible nickname. Unknown responses are excluded from results. Errors stop the search while preserving results already found.

Bookmarks are currently shown for the active tab session. The app writes them to local browser storage, but restoring them after reload is not yet implemented. They are not sent to a developer server.

### Update and troubleshooting

Replace the extension files, click the reload button on the browser's extensions page, and reopen the NickHub tab.

- **Missing manifest:** select the inner folder containing `manifest.json`.
- **FACEIT tab missing:** open FACEIT in the same browser profile.
- **Sign-in or access error:** sign in on FACEIT, check that the site loads normally, and retry.
- **Rate limit:** wait for the displayed pause or stop the search. Repeated limits stop the run.

### Privacy and access

No API key, password or developer-owned server is required. NickHub reads the shop response through an existing FACEIT tab. The browser sends its normal session credentials directly to FACEIT; the extension does not extract cookies or tokens and does not send them to the developer. Nicknames being checked are sent to FACEIT.

The extension requests access only to `https://www.faceit.com/*` and the `scripting` permission needed to run the check in that tab. It does not purchase names or change account settings. GitHub and Twitch do not receive automatic requests from the extension; the Twitch link opens only when clicked.

This project uses an undocumented FACEIT shop interface, which may change. It is not affiliated with or endorsed by FACEIT.

## Русский

### Возможности

- Фильтры по длине, подстроке, началу и окончанию ника, буквам и цифрам.
- Поиск свободных ников, Idle Nickname Claim или обоих типов.
- Копирование и сохранение результатов в избранное на время текущей сессии.
- Свежая проверка доступности, прогресс и остановка поиска.
- До двух одновременных проверок и автоматические паузы при ограничениях FACEIT.

### Установка

1. Скачай репозиторий через **Code → Download ZIP** и распакуй архив.
2. Открой `chrome://extensions` в Chrome или `edge://extensions` в Edge.
3. Включи **Режим разработчика** и нажми **Загрузить распакованное расширение**.
4. Выбери папку, внутри которой лежит `manifest.json`, а не её родительскую папку.
5. Открой NickHub через меню расширений браузера.

Chrome проверен разработчиком. Edge и Яндекс Браузер требуют отдельного тестирования совместимости. Эта сборка не поддерживает Firefox.

### Использование

1. Открой [FACEIT](https://www.faceit.com/) в **том же браузере и профиле**, войди в аккаунт и оставь вкладку открытой. Она может находиться в фоне.
2. Открой NickHub и задай фильтры. Например, длина **4**, содержит **503** — 72 варианта при выборе букв и цифр.
3. Выбери нужные типы доступности и нажми **Найти никнеймы**.
4. Для остановки нажми **Остановить поиск**. Уже отправленные запросы могут завершиться.
5. Для одного ника используй поле индивидуальной проверки.

Доступность актуальна на момент проверки и может измениться. Широкие запросы проверяют ограниченную выборку до 120 вариантов, а не все возможные имена. Неопределённые ответы скрываются. При ошибке поиск останавливается, сохраняя уже найденные результаты.

Избранное сейчас отображается в текущей сессии вкладки. Приложение записывает его в локальное хранилище браузера, но восстановление после перезагрузки ещё не реализовано. На сервер разработчика избранное не отправляется.

### Обновление и решение проблем

Замени файлы расширения, нажми кнопку обновления на странице расширений браузера и заново открой вкладку NickHub.

- **Не найден манифест:** выбери внутреннюю папку с `manifest.json`.
- **Нет вкладки FACEIT:** открой сайт в том же профиле браузера.
- **Ошибка входа или доступа:** войди на FACEIT, проверь, что сайт загружается нормально, и повтори поиск.
- **Лимит запросов:** дождись указанной паузы или останови поиск. Повторное ограничение завершит запуск.

### Конфиденциальность и доступ

API-ключ, пароль и сервер разработчика не нужны. NickHub читает ответ магазина через открытую вкладку FACEIT. Браузер отправляет данные своей сессии непосредственно FACEIT; расширение не извлекает cookies или токены и не передаёт их разработчику. Проверяемые никнеймы отправляются FACEIT.

Разрешения ограничены сайтом `https://www.faceit.com/*` и выполнением скрипта проверки в его вкладке. Расширение не покупает ники и не меняет настройки аккаунта. Автоматических обращений к GitHub и Twitch нет; ссылка Twitch открывается только по нажатию.

Проект использует недокументированный интерфейс магазина FACEIT, который может измениться. Это неофициальное расширение, не связанное с FACEIT.

