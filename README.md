# Spanish Words Learning App

Full-stack application for learning Spanish words with spaced repetition system.

## Project Structure

```
spanishwords/
├── frontend/     # React + TypeScript + Vite frontend
└── backend/      # Node.js + Express + MongoDB backend
```

## Frontend

Frontend is built with:
- React + TypeScript
- Vite
- Tailwind CSS
- ESLint

### Setup
```bash
cd frontend
npm install
npm run dev
```

## Backend

Backend is built with:
- Node.js + Express
- TypeScript
- MongoDB
- JWT Authentication

### Setup
```bash
cd backend
npm install
# Create .env file with required variables
npm run dev
```

### Environment Variables
Create `.env` file in backend directory with:
```
PORT=5000
MONGODB_URI=mongodb://localhost:27017/spanishwords
JWT_SECRET=your-super-secret-key-change-in-production
JWT_EXPIRES_IN=7d
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=admin123
```

## Development

1. Start MongoDB (using Docker):
```bash
docker run -d --name mongo -p 27017:27017 -v mongo_data:/data/db mongo
```

2. Start backend:
```bash
cd backend
npm run dev
```

3. Start frontend:
```bash
cd frontend
npm run dev
```

## Features

- User authentication
- Word learning with spaced repetition
- Progress tracking
- Admin panel for word management
- Responsive design
