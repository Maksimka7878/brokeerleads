# 🚀 Deployment Guide for Vercel

Your project is fully configured for Vercel deployment (Next.js Frontend + FastAPI Backend).

## Prerequisites

1.  **Vercel Account**: Sign up at [vercel.com](https://vercel.com).
2.  **GitHub/GitLab/Bitbucket**: Push this code to a repository.

## Step 1: Push to Git

If you haven't initialized git yet:

```bash
git init
git add .
git commit -m "Initial commit"
# Add your remote origin
# git remote add origin https://github.com/yourusername/your-repo.git
# git push -u origin master
```

## Step 2: Deploy on Vercel

1.  Go to **Vercel Dashboard** -> **Add New...** -> **Project**.
2.  Import your Git repository.
3.  **Configure Project**:
    - **Framework Preset**: Next.js (should be auto-detected).
    - **Root Directory**: `./` (default).
4.  **Environment Variables** (Critical!):
    Add the following variables in the Vercel UI:

    - `TG_TOKEN`: Your Telegram Bot Token (from BotFather).
    - `SECRET_KEY`: A random string for security (e.g., generated via `openssl rand -hex 32`).
    - `DATABASE_URL`:
      - **For Testing**: Leave empty (will use ephemeral SQLite, resets on redeploy).
      - **For Production**: Add a PostgreSQL URL (e.g., from Vercel Storage or Neon).
      - Example: `postgres://user:password@host:port/database`

5.  Click **Deploy**.

## Step 3: Set up Telegram Webhook

Once deployed, you will get a domain (e.g., `https://your-project.vercel.app`).

You need to tell Telegram where to send messages. Open this URL in your browser:

```
https://your-project.vercel.app/api/telegram/set_webhook?url=https://your-project.vercel.app
```

You should see `{"status": "success"}`.

## Step 4: Database (Important!)

By default, this project uses **SQLite**. On Vercel, the file system is **read-only/ephemeral** for serverless functions.

- This means your users and leads **WILL DISAPPEAR** when the server restarts or you redeploy.
- **Recommendation**: Enable **Vercel Postgres** in the Storage tab of your project and copy the connection string to `DATABASE_URL`. The code is already compatible with Postgres.

## Troubleshooting

- **Build Failures**: Check the "Build Logs" in Vercel.
- **500 Errors**: Check "Runtime Logs". Usually missing environment variables.
