# Frontend

Эта папка заменяет frontend в проекте Web_lab4. Сохраните её рядом с backend и docker-compose.yml.

Из корня Web_lab4:

```bash
docker compose up -d --build --force-recreate frontend
```

Если запускаете весь проект впервые: `docker compose up --build`.
Открыть http://localhost:8080. Учебный вход администратора: admin / Admin12345.
Остановка из корня: `docker compose down`.

Локальные проверки из frontend (Node.js 22.12+):

```bash
npm ci
npm test
npm run build
```

Отмена удаления доступна 10 секунд. Обновление страницы не сбрасывает отсчёт.
Сообщения об ошибках формы показываются после выхода из поля или попытки отправки.
