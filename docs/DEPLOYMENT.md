# Deploying NexHire

This creates a fresh public deployment on free tiers: Supabase for the database, Render for the API, and Vercel for the website. It doesn't change any existing deployment.

Never paste secrets into code, GitHub, or chat. Enter them only in the Render dashboard.

## 1. Create a new Gemini key

1. Open [Google AI Studio](https://aistudio.google.com/apikey).
2. Create a new API key and copy it.
3. Delete the old key that was exposed in the repository's git history.

## 2. Create the database

1. Create a new project at [Supabase](https://supabase.com/dashboard).
2. Choose and save a strong database password.
3. Click **Connect** and copy the **Session pooler** connection string.
4. Replace `[YOUR-PASSWORD]` with your password. If it has special characters, URL-encode them.

Use the Session pooler because Render's free tier may not reach Supabase's IPv6-only direct connection.

## 3. Deploy the API on Render

1. In [Render](https://dashboard.render.com), choose **New > Blueprint**.
2. Connect the `NexHire` repository and select the `feature/resume-intelligence` branch.
3. Enter these values:

| Variable | Value |
|---|---|
| `DATABASE_URL` | Supabase Session pooler URL |
| `DIRECT_URL` | The same Supabase Session pooler URL |
| `GEMINI_API_KEY` | Your new Gemini key |
| `CORS_ORIGINS` | `http://localhost:5173` for now |

4. Deploy, then open `https://YOUR-API.onrender.com/ready`. It should show `{"status":"ready"}`.

## 4. Deploy the website on Vercel

1. In [Vercel](https://vercel.com/new), import the `NexHire` repository.
2. Set **Root Directory** to `frontend/nexhire-frontend`.
3. Add the environment variable `VITE_API_URL` with your Render URL and no trailing slash.
4. Deploy from the `feature/resume-intelligence` branch by making it the project's production branch.

## 5. Connect them

1. In Render, change `CORS_ORIGINS` to your exact Vercel URL, such as `https://nexhire-demo.vercel.app`.
2. Save and let Render redeploy.
3. Open the Vercel URL, register, and complete one interview.

## Free-tier behavior

- Render's free service sleeps when idle, so the first request can take up to a minute.
- Each user can start 3 interviews per day. Change `DAILY_INTERVIEWS` to adjust this.
- When Gemini's daily quota is reached, the app shows a clear message and keeps the user's answer in the browser.
