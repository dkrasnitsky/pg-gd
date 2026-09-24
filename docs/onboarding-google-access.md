# Доступы к Google-таблицам

Каждому, кто будет пользоваться приложением, нужен **доступ на редактирование** к таблицам тех инструментов, которые он будет использовать (доступ выдаёт Дима через обычный Share в Google Drive). Ниже — список по инструментам.

## Lottery Simulator
- Lottery (прод): `1d2mBr0-yDswgyFzTeaFHdbNEizukTEtCtaYkG3PzouI`
- Lottery (тест): `10s8UQTOfFupR3afkyU0nmvKo_crLPjREHFTolesQK54`
- Schedule (общий для Lottery/CardRoulette/PersonalEvent): `12WklJDMluXtBqlRzJblNLVvxXqh86R4hKbdLw7Mm-KE`
- EventCenterConfigV2 (прод): `1tIXmTByMu6TRlyn7t-5hJHdCB__70M6DbSbvMItefL0`
- EventCenterConfigV2 (тест): `1ZNXorevxFq6Tlxbr9FjljuQXzM9jCv7KuIt7jbHz_uE`

## Card Roulette
- CardRoulette (прод): `1onDfSBGSAnHqLTglpj0upGhBZCJrjkL50V03sVnlFrk`
- CardRoulette (тест): `1lIRQ8FT0vWZcsgHwl1clhZrNuY2RxCGV7faf_0hl5JE`
- Schedule — тот же, что у Lottery
- EventCenterConfigV2 — тот же, что у Lottery

## Personal Event
- Schedule — тот же, что у Lottery
- Board: `18NncLI5KUdqG-j4C81P-smduV5Yz5yiUNU2IEquYX2Y`
- Linear: `1nW_7hBl2bcdJ_kvsp8QESkMgw6Fk1_wYclcPUKGHyKw`
- TasksHorizontal: `1WZ9VWAecfOlbDXtMCBrI0Up9h83YEXGj7T5Ouxxg7-E`
- TasksVertical: `1aZWPsqRbPJSXjHQgxhsraQkugOi6VDrA8xUFnhmjOAw`
- TopUp: `1QGK9JE7gm1UGzg259O9uIoWaI3JkRkfj7uJPjjW-Fh0`
- Wheel: `1mrxcDYCoFRh4hScGYjT85TSOig3UVPWB4qIbxpD0hJc`
- Справочник задач (используется и в Template Event): `1woPA0mmXlRoTCjXwnOg2_D9n8Pveul2bWZYITgTwUOI`
- EventCenterConfigV2 — тот же, что у Lottery

## Offer Constructor
- GameOffersSystem (прод): `1vlDGjRJqApHyicMYLd9PtFhL9C5FCl0jhD0N4D2zyWs`
- GameOffersSystem (тест): `1doZu0uLJTyNiAlx1D3SHih4Lw6AJDvVNpxMMvx6pjLE`

## Trader Van
- `1qKogyjkoHpO6imV1aU5ZyWKpFuF9Hr_qPYyc8RpamfE`

## Template Event
- Прод — тот же справочник, что у Personal Event: `1woPA0mmXlRoTCjXwnOg2_D9n8Pveul2bWZYITgTwUOI`
- Тест: `1A4BnV-Dor4I4XsLJJyPnBYpVUZNmul0jEhE4ahV04rU`

## График ивентов (синхронизация + карты)
- EventCenterConfigV2 (прод/тест) — те же, что у Lottery
- Актуальные карты: `1e_y2x7YRupUSDXxhpsiOLzKTcDE8yq4oahgRiNgNfHU`

## Подбор Контента
- Таблица тиров/аналитики оружия: `1YKQ4dtCBeUVpMy1oaBxFC-nS4udGHvjYU_qx7U1HTMs`
- Таблица контент-пулов: `1uOsaKGRCU1gghA5yGFDGXNl13bP5IwP5GnbO8VksLfM`

## OAuth

Плюс к доступам — у каждого свой **Google OAuth Desktop-клиент** (JSON). При первом обращении к Google Sheets приложение попросит выбрать этот файл, авторизация откроется в браузере, токен сохранится локально (`safeStorage`), в репозиторий не попадает. Если у команды пока нет общего процесса выдачи OAuth-клиентов новым людям — это отдельный вопрос, который стоит решить до раздачи установщика.
