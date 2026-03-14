# ShopList

A collaborative shopping list app. Create lists, add items, check them off while shopping, and share lists with other users.

## Stack

- **Frontend** — React 18, Vite, Tailwind CSS
- **Backend** — Node.js, Express
- **Database** — MongoDB
- **Auth** — JWT

## Features

- Register / login
- Create and delete shopping lists
- Add, edit, and delete items
- Check items off while shopping
- Share lists with other users by email

## Project Structure

```
shoplist/
├── frontend/       # React app
├── backend/        # Express API
├── Dockerfile      # Single image: builds frontend, serves via backend
└── docker-compose.yml
```

## Running Locally

**With Docker Compose:**

```bash
docker compose up
```

App available at `http://localhost:3000`.

**Without Docker:**

```bash
# Backend
cd backend
cp .env.example .env   # set MONGODB_URI and JWT_SECRET
npm install
npm run dev

# Frontend (separate terminal)
cd frontend
npm install
npm run dev
```

Frontend runs on `http://localhost:5173`, backend on `http://localhost:3000`.

## Environment Variables

| Variable | Description |
|---|---|
| `MONGODB_URI` | MongoDB connection string |
| `JWT_SECRET` | Secret for signing JWT tokens |
| `NODE_ENV` | Set to `production` to serve the frontend |
| `PORT` | Port to listen on (default: `3000`) |

## Deployment

Pushes to `main` automatically build and deploy via GitHub Actions.

Required secrets in GitHub repo settings:

| Secret | Description |
|---|---|
| `DOCKERHUB_USERNAME` | Docker Hub username |
| `DOCKERHUB_TOKEN` | Docker Hub access token |
| `SSH_HOST` | Server IP or hostname |
| `SSH_USERNAME` | SSH user |
| `SSH_PRIVATE_KEY` | SSH private key |
| `JWT_SECRET` | JWT secret |
| `MONGODB_URI` | MongoDB connection string |
| `DOCKER_NETWORK` | Docker network name on the server |
