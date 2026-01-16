# B2B Sales Tracker (Vercel Edition)

Современная CRM система с веб-интерфейсом на Next.js и бекендом на FastAPI.

## 🛠 Технологии
- **Frontend**: Next.js, React, Tailwind CSS, Recharts
- **Backend**: FastAPI, SQLAlchemy, Pandas
- **Database**: SQLite (local) / PostgreSQL (production)
- **Deployment**: Vercel

## 🚀 Локальный запуск

1. **Установка зависимостей**:
   ```bash
   pip install -r requirements.txt
   npm install
   ```

2. **Запуск Backend** (в отдельном терминале):
   ```bash
   uvicorn api.index:app --reload --port 8000
   ```

3. **Запуск Frontend**:
   ```bash
   npm run dev
   ```
   Откройте [http://localhost:3000](http://localhost:3000)

## ☁️ Деплой на Vercel

1. Установите Vercel CLI: `npm i -g vercel`
2. Запустите деплой:
   ```bash
   vercel
   ```
3. **Важно**: Для продакшена необходимо подключить внешнюю базу данных (например, **Vercel Postgres** или **Supabase**), так как файловая SQLite база будет сбрасываться при каждом деплое.
   - Добавьте переменную окружения `DATABASE_URL` в настройках проекта Vercel.
   - Пример: `postgres://user:pass@host:5432/dbname`
