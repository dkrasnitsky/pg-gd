# Template Event

**Статус:** первая рабочая версия, проверено на `Lunar2026` и `EscapeVelocity2025`.

## 1. Источник данных

Та же гигантская таблица, что используется как справочник задач для Personal Event: `1woPA0mmXlRoTCjXwnOg2_D9n8Pveul2bWZYITgTwUOI` (прод). Тестовая копия: `1A4BnV-Dor4I4XsLJJyPnBYpVUZNmul0jEhE4ahV04rU`.

**Лист со списком событий (Schedule):** gid `1538831076`, колонки `IsEnable | EventId | EventName | StartDate | Status`.

**Важно:** `EventName` из Schedule и суффикс листов события **должны совпадать строго**, по решению Димы. Для старых ивентов (например тестовая строка `202607LockAndLoad` с реальными листами `Common_LockAndLoad2025`) это может не совпадать — в таком случае инструмент просто не найдёт листы, это ожидаемое поведение, не баг.

## 2. Обнаружение листов события — динамическое, не по фиксированному списку

У разных ивентов **разное количество и разные названия** доп. листов (например `EscapeVelocity2025` имеет `Progress_Map_1..4`, у других механик другие суффиксы). Поэтому вместо проверки фиксированных префиксов (`Progress_Sequential_`/`Progress_Accumulative_` — так было в первой версии, оказалось неверно) код:
1. Читает список ВСЕХ листов таблицы.
2. Находит те, что заканчиваются на `_<EventName>` (точное совпадение по суффиксу).
3. `Common_<EventName>` и `Tasks_Group_<EventName>` — обрабатываются специально (см. ниже).
4. Все остальные совпавшие листы — под кнопку с названием (суффикс отрезан, `_` → пробел), пытаются распарситься как «блок MainRewards + таблица наград» (см. п.4). Если структура не подходит — просто показываются как сырая таблица (read-only).

## 3. Common_ — структура

Один лист, четыре блока подряд:
- **Мета-строка**: `EventId, Style, LevelOpen, MechanicIds, InfoStageDuration, ActiveStageDuration, AddedStageDuration, TimeUntilEndActiveStageForPopUp, MainPrefabName, NotificationPrefabName, LobbyButtonPrefabName, InfoPrefabName, LobbyViewPrefabName, PremiumPackOne/TwoPrice/Bonus/Sale, InfoPopupPreviewRewards, CompletedProgressToDisableMechanics`
- **NotificationBanners**: `StartInfoStage/StartActiveStage/BeforeEndActiveStage/StartAddedStage/EndEvent` (как у Personal Event)
- **SettingsInStages**: транспонированная таблица — 4 строки-поля (`ShowLobbyButton/ShowLobbyView/EnableCashback/CanMoveToEvent`), 3 колонки-стадии (`Info/Active/Added`). Единственное место в проекте с такой ориентацией.
- **Shops**: `Name | OfferIds | UnlockByProgress` — **только ссылки на id уже существующих офферов** (создаются/редактируются в Offer Constructor), сама механика магазина не хранит параметры наград здесь.

## 4. «MainRewards + таблица наград» — общий паттерн для доп. листов

Обнаружен эмпирически на реальных данных (`LockAndLoad2025`, `EscapeVelocity2025`). Один такой блок на лист:
- Заголовок `MainRewards | MainRewardsAlternative | ShowMainRewardsInPreview [| LockParams]` + 1 строка данных.
- Таблица наград с заголовком `Id | ...` — **набор колонок отличается между механиками** (у `Progress_Map_N` — `Id/Reward/AlternateReward/Price/ShowInPreview/IsPremium/CellIds`, у других — `Id/Reward/AlternateReward/Price/BuyLimit/Size/ShowInPreview/IsPremium[/AutoPurchase]`).

Парсер (`parseProgressLevelSheet`) читает **какие колонки реально есть** по названию — не хардкодит фиксированный список. Редактор (`ProgressLevelEditor`) рисует ровно те колонки, что нашлись, плюс чекбоксы для `IsPremium`/`ShowInPreview`/`ShowMainRewardsInPreview`. Если структура листа не подходит под этот паттерн (нет блока `MainRewards`) — используется read-only просмотр сырых строк.

## 5. Tasks_Group_

Плоская таблица: `GroupName | Group | Index | TaskId | NeededCount | Rewards | Priority | IsPremium | ConditionType | IntParams | ItemIndex | ItemType | ItemCategory` (+ 4 колонки «только для GD», не редактируются).

`GroupName` в реальных данных — визуально смёрженная ячейка (заполнена только в первой строке группы, у остальных строк пусто). При чтении — «протягивается» вниз (forward-fill) для удобства редактирования; при записи — обратно оставляется только в первой строке группы (сама merge-разметка ячеек не восстанавливается, только значение).

**TaskId** — поле с выпадающим списком из справочника задач (`google:get-task-reference`, тот же, что у Personal Event), формат подсказки `Id — GDDescpiption`. Выбор подставляет только числовой TaskId. Можно вписать вручную. Колонка `Index` (отдельная, порядковый номер) — обычное текстовое поле, не путать с TaskId.

## 6. UI

- Поиск+выбор события совмещены в одном поле (текстовый ввод с выпадающим списком, фильтруется по вводу).
- Кнопки над контентом — не фиксированные «Механики»/«Задачи», а по одной на каждый реально найденный лист (плюс всегда «Механики» и «Задачи», даже если для события их нет — покажут заглушку).
- «Сохранить» — обновляет все найденные листы на месте. «Сохранить как новый» — дублирует ВСЕ найденные листы (сколько бы их ни было) под новым именем, создаёт новую строку в Schedule, затем пишет туда же текущие изменения.

## 7. Открытые вопросы / не реализовано

- Реальное название листа со списком событий (Schedule) не подтверждено визуально (мой инструмент чтения таблиц не показывает имена листов, только gid и данные) — определено по описанию Димы и структуре данных.
- Если у какого-то события структура доп. листа не подходит под паттерн «MainRewards + таблица» (п.4) — он остаётся read-only. При необходимости — разобрать конкретный пример и добавить парсер по аналогии.
