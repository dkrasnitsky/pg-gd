# Personal Event

**Статус:** Все 6 подтипов готовы и проверены на реальных данных: Board, Linear, TasksHorizontal, TasksVertical, TopUp, Wheel.
**Тип события в календаре:** Personal Event

## 1. Где что настраивается

| Где | Что именно настраивается здесь |
|---|---|
| Инструмент (Personal Event → выбор типа большими кнопками → Board/Linear) | Мета (Style/MechanicIds/длительности/имена префабов/InfoPopupPreviewRewards), NotificationBanners, таблица наград (создание/удаление строк) |
| График ивентов (окно события типа Personal Event) | Подтип, start/end date-time, EndCompletionDate (авто = end + 2 дня, редактируемо), Segment (из справочника EventCenterConfig), Expression (авто = Expression выбранного сегмента из справочника, редактируемо), GroupId/Примечание (по умолчанию из последней строки того же EventType в Schedule), выбор сохранённого баланса |

Перед записью — обязательное превью (кнопка «Показать превью») с точным списком того, что будет отправлено. Тестовых копий таблиц Board/Linear нет — таблицы боевые в любом случае, тест влияет только на то, в какую EventCenterConfigV2 (прод/тест) уходит строка.

## 2. Google Sheets — Board

### Точка A: собственная таблица Board (без разделения тест/прод — общая)
**Таблица:** 18NncLI5KUdqG-j4C81P-smduV5Yz5yiUNU2IEquYX2Y
**Паттерн:** дублирование листов по числовому суффиксу (не по имени ивента!)

- Находится **последний по номеру** `Common_PersonalDrawerOfFortune<N>` и `Progress_Wheel_PersonalDrawerOfFortune<N>`, дублируются в `<...><newId>`, где `newId` = следующий свободный Id для EventType="Board" (см. Точка C).
- **Common_** — мета-таблица (EventId/Style/MechanicIds/.../InfoPopupPreviewRewards) + отдельный блок NotificationBanners. Пишутся все поля, которые задал пользователь в инструменте.
- **Progress_Wheel_** — блок OpenCellPrice/GemsOpenCellPrice/PriceMultiplier1/SpinType + плоская таблица наград `Id/Reward/AlternateReward/BuyLimit/DropChance/Cool/ShowInPreview` (создание/удаление строк, без группировки по какому-либо ключу — не как у Card Roulette).
- Reward/AlternateReward собираются как `{item}:{количество}`.

## 2б. Google Sheets — Linear (отличия от Board)

**Таблица:** 1nW_7hBl2bcdJ_kvsp8QESkMgw6Fk1_wYclcPUKGHyKw (общая, без разделения тест/прод, как и у Board)
**Паттерн:** тот же принцип дублирования по числовому суффиксу (`Common_PersonalLinear<N>`, `Progress_Accumulative_PersonalLinear<N>`)

- **Common_** — идентична Board (те же поля и NotificationBanners), переиспользуется та же функция записи.
- **Progress_Accumulative_** — блок `ItemExp | Boost | CurrencyToXP` (вместо цены открытия у Board) + плоская таблица наград `Id/Reward/AlternateReward/XPAmount/Cool/ShowInPreview` (нет DropChance/BuyLimit — вместо них порог накопленного XP).
- **Формат полей в инструменте:**
  - `ItemExp` — 2 подполя (id + кол-во), склеивается как `id:count`.
  - `CurrencyToXP` — 3 подполя (Тип/Id/Кол-во), тип можно оставить пустым — тогда без префикса (`id:count`), иначе `Тип:id:count`.
  - `Reward` и `AlternateReward` в таблице наград — только `id:count`, без типа (по просьбе Димы, хотя в реальных данных встречается и 3-частный формат типа `Currency:GemsCurrency:100` — если понадобится, потребуется вручная правка листа через Google Sheets).

### Точка B: общий Schedule (одна таблица на все 6 подтипов Personal Event)
**Таблица:** 12WklJDMluXtBqlRzJblNLVvxXqh86R4hKbdLw7Mm-KE
**Паттерн:** добавление строки (копия последней строки с тем же `EventType`, с подменой полей)

- `IsEnable` — пишется как **boolean `false`**, не строка (иначе Google Sheets ругается на валидацию чекбокса).
- `Id` — новый (см. Точка C).
- `EventType` — "Board"/"Linear" (или другой подтип).
- `StartDistributionDate`/`EndDistributionDate` — ISO с секундами (`YYYY-MM-DDTHH:MM:SS`), как у Lottery/Card Roulette.
- `EndCompletionDate` — **формат `дд.мм.гггг ч:мм:сс`** (не ISO!) — единственное поле с другим форматом даты в этой же строке. По умолчанию = EndDistributionDate + 2 дня, но редактируемо.
- `Expression`, `GroupId`, `Примечание GD` — из формы (Expression = Expression выбранного сегмента, остальное по умолчанию из последней строки того же EventType).

### Точка C: next-id (только чтение)
Id считается как максимум колонки `Id` в Schedule, **отфильтрованному по `EventType`** — у каждого подтипа свой диапазон id (Board ~4xxx, Linear ~2xxx, TasksHorizontal ~13xx, TasksVertical ~14xx, TopUp ~15-16xx, Wheel ~1xxx/3xxx), не общий счётчик.

### Точка D: EventCenterConfigV2 → PersonalizedEvent (общая для всех фич таблица)
**Прод:** 1tIXmTByMu6TRlyn7t-5hJHdCB__70M6DbSbvMItefL0, gid 916675254
**Тест:** 1ZNXorevxFq6Tlxbr9FjljuQXzM9jCv7KuIt7jbHz_uE, gid 1513551562
**Паттерн:** добавление строки (копия последней с подменой)
**Колонки:** EventId C, StartDistributionDate D, EndDistributionDate E, Segment F, GroupId G, Style I

⚠️ Была найдена и исправлена ошибка: таблица (не только gid) должна переключаться на тестовую при `target=test` — раньше переключался только gid, и запись всегда уходила в прод-таблицу.

### Справочник сегментов (используется и Lottery, и Card Roulette, и Personal Event)
**Таблица:** EventCenterConfig, лист по `segmentsSheetGid`
**Колонки:** B = название сегмента (для дропдауна), C = Expression (сегментное условие)
При выборе сегмента в конструкторе Expression подставляется из колонки C автоматически.

## 3. Известная особенность — порядок дублируемых листов

Google Sheets API вставляет дубликат листа **сразу после источника**, а не в конец таблицы. При дублировании нескольких шаблонных листов за один `batchUpdate` порядок обработки запросов влияет на итоговый порядок вкладок. Рабочее решение — отправлять запросы на дублирование **в обратном порядке** (последний нужный лист дублируется первым). Применено к Card Roulette и Personal Event (Board и Linear). Если аналогичная проблема проявится у Lottery — её дублирование использует свой механизм (принудительная перестановка индексов после дублирования, привязка к листу `EggsAndPets`), там нужно чинить отдельно, если будет конкретный пример.

## 3б. Устойчивость к временным ошибкам Google Sheets

Общая функция `sheetsRequest` (используется всеми фичами — Lottery, Card Roulette, Personal Event) автоматически повторяет запрос до 3 раз при временных ошибках (503/429/5xx, например «The service is currently unavailable»). Если всё равно не получилось — в конфигураторе Personal Event для списка сегментов показывается явная ошибка и кнопка «Обновить» вместо тихого пустого списка.

## 2в. Google Sheets — TasksHorizontal (отличия от Linear)

**Таблица:** 1WZ9VWAecfOlbDXtMCBrI0Up9h83YEXGj7T5Ouxxg7-E (общая, без разделения тест/прод)
**Паттерн:** теперь **три** листа на дублирование вместо двух: `Common_PersonalTaskBookHorizontal<N>`, `Progress_Accumulative_PersonalTaskBookHorizontal<N>`, `Tasks_Simple_PersonalTaskBookHorizontal<N>`

- **Common_** — без `MechanicIds` (в отличие от Board/Linear) — функция записи это уже безопасно игнорирует (просто не находит колонку).
- **Progress_Accumulative_** — **только `ItemExp`**, без `Boost`/`CurrencyToXP` (это только у Linear!). Поиск заголовка блока требует только `ItemExp` (не оба сразу, как было сначала ошибочно сделано — привело к ошибке при первом тесте). Таблица наград (Id/Reward/AlternateReward/XPAmount/Cool/ShowInPreview) — та же функция, что и у Linear.
- **Tasks_Simple_** (новый лист) — плоская таблица `Index/TaskId/NeededCount/Rewards/TaskPrice`. `Index` проставляется автоматически (1..N по порядку), не редактируется вручную. `Rewards` — `id:count`. `TaskPrice` — `Тип:id:count` (в реальных данных всегда тип `Currency`).
- **Справочник задач** — кнопка в инструменте, read-only, с поиском. Источник: таблица 1woPA0mmXlRoTCjXwnOg2_D9n8Pveul2bWZYITgTwUOI, лист по gid 1207975760, колонки `TaskId`/`GDDescpiption` (именно так, с опечаткой — это реальное имя колонки в таблице, не опечатка в нашем коде).

## 3в. Известная ошибка при разработке (исправлена)

Сначала предположила, что у TasksHorizontal та же структура Progress-листа, что и у Linear (ItemExp+Boost+CurrencyToXP) — это оказалось неверно, там только ItemExp. Приводило к ошибке при первом применении. Вывод: даже когда паттерн выглядит похожим на уже реализованный, структуру каждого подтипа нужно проверять отдельно по реальной таблице, не по аналогии.

## 2г. Google Sheets — TasksVertical (отличия от TasksHorizontal)

**Таблица:** 1aZWPsqRbPJSXjHQgxhsraQkugOi6VDrA8xUFnhmjOAw (общая, без разделения тест/прод)
**Паттерн:** три листа, как у TasksHorizontal (`Common_PersonalTaskBookVertical<N>`, `Progress_Accumulative_PersonalTaskBookVertical<N>`, `Tasks_Simple_PersonalTaskBookVertical<N>`). Common и Progress — те же функции записи (Progress — только `ItemExp`, как и у TasksHorizontal).

**Tasks_Simple_ отличается от TasksHorizontal:**
- **`Index`** — не просто 1..N, а **`EventId` + двузначный номер задачи по порядку`** (например, EventId 1504 → индексы 150401, 150402, ... 150410). Считается автоматически в обработчике применения (`${nextId}${номер.padStart(2,"0")}`), в инструменте не вводится.
- **`Rewards`** — тут это **список пар через запятую** (например `47032:1,77032:25`), а не одна пара id:count. Поэтому в инструменте это свободное текстовое поле, а не два подполя id+кол-во, как у TasksHorizontal.
- `TaskPrice` — тот же формат `Тип:id:count`, как у TasksHorizontal.

## 2д. Google Sheets — TopUp (отличия от Board/Linear)

**Таблица:** 1QGK9JE7gm1UGzg259O9uIoWaI3JkRkfj7uJPjjW-Fh0 (общая, без разделения тест/прод)
**Паттерн:** два листа (`Common_PersonalTopUp<N>`, `Progress_Sequential_PersonalTopUp<N>`)

- **Common_** — с `MechanicIds` (в отличие от TasksHorizontal/Vertical, там его нет) — та же функция записи.
- **Progress_Sequential_** — блок `AdsPointName/CashBackFromUSD/CashBackFromGems/CashBackFromCoins/CashBackFromPixelPassCurrency/HowItWorkPlace` + плоская таблица `Id/Reward/AlternateReward/Price/Cool/ShowInPreview` (нет DropChance/BuyLimit/XPAmount).
- **`Reward`/`AlternateReward`/`Price`** — все три с необязательным типом (как `CurrencyToXP` у Linear) — пусто → `id:count`, заполнено → `Тип:id:count`. Здесь тип встречается чаще, чем в других подтипах (`EventCurrency:EventCurrency:35`, `GemsHarvester:gems_harvester_count_1:15` и т.п.).

## 3г. Известная ошибка — устаревший next-id при смене подтипа (исправлена)

При переключении подтипа `nextId` не сбрасывался до ответа асинхронного запроса — в UI могло на мгновение (или дольше, при медленном ответе Google) показаться **id от предыдущего подтипа**. Само создание конфига не страдало — бэкенд внутри IPC-хендлера всё равно считывает next-id заново, независимо от того, что показано в клиенте — но само превью могло показывать неверные имена будущих листов. Исправлено: `nextId` теперь сбрасывается в `null` сразу при смене подтипа (показывает «…» пока грузится), плюс флаг `cancelled` на случай быстрого повторного переключения подтипа до того, как пришёл первый ответ.

## 4. Закрытые вопросы (все подтипы реализованы)

Wheel of Fortune оказался структурно идентичен Board — та же функция записи, тот же компонент инструмента (параметризован `BoardEditor` с другим storeKey/дефолтами), разница только в таблице (1mrxcDYCoFRh4hScGYjT85TSOig3UVPWB4qIbxpD0hJc) и префиксах листов (`Common_PersonalWheelOfFortune<N>` / `Progress_Wheel_PersonalWheelOfFortune<N>`).

Все шесть подтипов готовы, открытых вопросов по Personal Event нет.

## 5. Отложено до релиза на коллег

- Балансы «Шаблон» (по одному на подтип, собраны из реальных присланных ивентов) сейчас лежат только в локальном `userData` на машине Димы (`personalEvent*Balances.json`), не в установщике и не в гите — установщик пакует код, а не пользовательские данные.
- Когда дойдём до раздачи коллегам: перенести эти файлы в репозиторий (например `docs/seed-data/` или прямо в `electron/` рядом с `google-oauth-default.json`) и научить приложение подхватывать их при первом запуске, если локального файла ещё нет — по аналогии с тем, как подхватывается встроенный Google OAuth клиент.
