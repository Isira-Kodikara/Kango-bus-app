# Deploying KANGO Smart Bus Navigation to Railway

This guide covers how to deploy the KANGO application (Monorepo with PHP Backend and React Frontend) to [Railway](https://railway.app/).

## Prerequisites

1.  A [Railway](https://railway.app/) account.
2.  This repository pushed to your GitHub account.

## 1. Create a Project and Database

1.  Log in to Railway and click **New Project** > **Provision MySQL**.
2.  Once validated, this will create a new project with a MySQL service.
3.  Click on the **MySQL** service card.
4.  Go to the **Data** tab to verify the database is running (it will be empty).

## 2. Deploy the Backend (PHP)

1.  In the same project, click **+ New** > **GitHub Repo**.
2.  Select your repository (`KANGO Smart Bus Navigation UI 2`).
3.  **Important:** Do not variables yet.
4.  Click on the newly created service card (it might fail initially, that's expected).
5.  Go to **Settings** > **General** > **Root Directory**.
    - Set this to: `/backend`
6.  Go to **Variables**. Add the following variables:
    - `MYSQL_HOST`: `${{ MySQL.HOST }}` (Use Railway's variable reference feature)
    - `MYSQL_PORT`: `${{ MySQL.PORT }}`
    - `MYSQL_DATABASE`: `${{ MySQL.DATABASE }}`
    - `MYSQL_USER`: `${{ MySQL.USER }}`
    - `MYSQL_PASSWORD`: `${{ MySQL.PASSWORD }}`
    - `JWT_SECRET`: (Generate a random string)
    - `PRODUCTION`: `true`
    - `CORS_ORIGINS`: `https://<YOUR-FRONTEND-URL>.up.railway.app` (You will update this after deploying the frontend)
7.  Railway's Nixpacks builder will automatically detect the `nixpacks.toml` and start the PHP server.
8.  Go to **Settings** > **Networking** > **Public Networking**.
    - Click **Generate Domain**.
    - Copy this URL (e.g., `backend-production.up.railway.app`).

## 3. Deploy the Frontend (React/Vite)

1.  Click **+ New** > **GitHub Repo** (Select the same repository again).
2.  Click on the new service card.
3.  Go to **Settings** > **General** > **Root Directory**.
    - Set this to: `/frontend`
4.  Go to **Settings** > **Build**.
    - **Build Command**: `npm run build`
    - **Start Command**: `npm run preview -- --port $PORT --host`
    - *Note: `vite preview` is used here for simplicity. For high traffic, consider serving the `dist` folder with Nginx or a static host.*
5.  Go to **Variables**. Add the following:
    - `VITE_API_URL`: Paste the Backend URL you copied earlier (e.g., `https://backend-production.up.railway.app`).
6.  Go to **Settings** > **Networking** > **Public Networking**.
    - Click **Generate Domain**.
    - Copy this URL.

## 4. Final Configuration

1.  Go back to your **Backend Service**.
2.  Update the `CORS_ORIGINS` variable with your **Frontend URL**.
3.  Redeploy the Backend service (usually happens automatically when variables change).

## 5. Database Setup (Migration)

Since the database is empty, you need to import your schema.
1.  Connect to the Railway MySQL database using a tool like **TablePlus** or **DBeaver** using the credentials from the MySQL service **Variables** tab.
2.  Run the SQL scripts located in the `/database` folder of your repository to create tables and seed data.

## Troubleshooting

-   **Backend 404s:** Ensure `Root Directory` is set to `/backend`.
-   **Database Connection Error:** Verify the `${{ MySQL... }}` variables are correctly referenced.
-   **CORS Errors:** Ensure the frontend domain is listed in the backend's `CORS_ORIGINS` without trailing slashes.
