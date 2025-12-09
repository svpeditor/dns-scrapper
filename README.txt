DNS SCRAPER SERVICE

РАЗВОРАЧИВАНИЕ НА RAILWAY:

1. Зайдите на https://railway.app
2. Create New Project → Deploy from ZIP
3. Загрузите dns-scraper.zip
4. Railway автоматически определит Node.js проект
5. После деплоя будет URL вида:
   https://имя.up.railway.app/scrape?url=https://www.dns-shop.ru/...

Файлы внутри:
- server.js — основной Puppeteer скрапер
- package.json — зависимости
- railway.json — отключает Docker
- README.txt — инструкция
