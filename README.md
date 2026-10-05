# Green API Messenger

Тестовое React-приложение для работы с чатами Green API / MAX.

## Возможности

- авторизация по `idInstance` и `apiTokenInstance`;
- загрузка списка чатов и истории сообщений;
- отправка текстовых сообщений;
- получение входящих сообщений через long polling;
- повторная загрузка истории при ошибке;
- адаптивная верстка для desktop и mobile.

## Запуск

Требуется Node.js 20 или новее.

```bash
npm install
npm run dev
```

Для проверки production-сборки:

```bash
npm run lint
npm run build
```

## Настройка

По умолчанию используется `https://api.green-api.com`. Другой адрес можно указать через `.env`:

```env
VITE_GREEN_API_URL=https://api.green-api.com
```

После запуска в форме авторизации вводятся значения `idInstance` и `apiTokenInstance` из личного кабинета Green API.

Credentials сохраняются в `localStorage` текущего браузера, чтобы не вводить их при каждом запуске. Для удаления сохранённых данных используйте кнопку «Выйти». В production-приложении токен следует хранить через серверный backend или другой защищённый механизм.

