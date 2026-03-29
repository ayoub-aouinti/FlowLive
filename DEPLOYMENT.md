# Deployment Guide: FlowLive

This guide explains how to deploy the FlowLive project using **Netlify** for the frontend and **Render** for the backend.

## Prerequisites
- A [GitHub](https://github.com/) account.
- A [Netlify](https://www.netlify.com/) account.
- A [Render](https://render.com/) account.
- A [MongoDB Atlas](https://www.mongodb.com/cloud/atlas) cluster (Free tier is fine).

---

## 1. Prepare MongoDB Atlas
1. Create a cluster on MongoDB Atlas.
2. Go to **Network Access** and add `0.0.0.0/0` (or the IP of your Render service).
3. Go to **Database Access** and create a user.
4. Get your connection string (e.g., `mongodb+srv://user:pass@cluster.mongodb.net/test`).

---

## 2. Deploy Backend on Render
1. Create a new **Web Service** on Render.
2. Connect your GitHub repository.
3. Set the following:
   - **Environment**: `Node`
   - **Root Directory**: `server`
   - **Build Command**: `npm install`
   - **Start Command**: `node index.js`
4. Add **Environment Variables**:
   - `MONGODB_URI`: Your MongoDB Atlas string.
   - `JWT_SECRET`: A random long string (e.g., `your_secret_here`).
   - `USE_LOCAL_DB`: `false`
   - `FRONTEND_URL`: Your Netlify URL (you'll get this in the next step).

---

## 3. Deploy Frontend on Netlify
1. Create a new site on Netlify.
2. Connect your GitHub repository.
3. Set the following:
   - **Build Command**: `npm run build`
   - **Publish Directory**: `dist`
4. Add **Environment Variables**:
   - `VITE_API_URL`: Your Render Web Service URL (e.g., `https://flowlive-api.onrender.com`).

---

## 4. Final Sync
1. Once Netlify is deployed, take its URL (e.g., `https://flowlive.netlify.app`).
2. Go back to Render settings and update the `FRONTEND_URL` variable with this address.
3. Redeploy Render.

**Success!** Your app is now live with a persistent database.
