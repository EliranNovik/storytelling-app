# Storytelling App

A full-stack application for creating and sharing stories collaboratively.

## Project Structure

This is a monorepo containing both frontend and backend code:

- `frontend/`: React + TypeScript + Vite application
- `backend/`: Node.js + Express + PostgreSQL backend
- `types/`: Shared TypeScript types

## Prerequisites

- Node.js (v18 or higher)
- PostgreSQL (v14 or higher)
- npm (v8 or higher)

## Environment Variables

### Backend (.env)

```
DATABASE_URL=postgresql://username:password@localhost:5432/storytelling_db
JWT_SECRET=your_jwt_secret
REFRESH_SECRET=your_refresh_secret
PORT=3000
```

### Frontend (.env)

```
VITE_API_URL=http://localhost:3000
```

## Getting Started

1. Clone the repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Set up environment variables (see above)
4. Start the development servers:
   ```bash
   npm run dev
   ```

## Available Scripts

- `npm run dev`: Start both frontend and backend in development mode
- `npm run dev:frontend`: Start only the frontend
- `npm run dev:backend`: Start only the backend
- `npm run build`: Build both frontend and backend
- `npm run test`: Run tests for both frontend and backend

## Features

- User authentication (JWT-based)
- Create, read, update, and delete stories
- Collaborative story editing
- Real-time updates
- Responsive design
- Dark/Light theme support
