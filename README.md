# Real-Time Kanban Board

A collaborative Kanban board where multiple users can create, move, and update
tasks in real time. Built as part of my software developer portfolio.

## Tech Stack
- Frontend: React (Vite)
- Backend: Node.js, Express
- Real-time sync: Socket.io
- Database: MongoDB
- Auth: JWT

## Project Structure
- `client/` — React frontend
- `server/` — Express backend + Socket.io server

## Status
🚧 In progress — building day by day.

## Roadmap
- [x] Day 1: Project setup
- [x] Day 2: Basic Express server
- [x] Day 3: MongoDB models
- [x] Day 4: REST endpoints for boards (GET/POST /api/boards)
- [x] Day 5-6: REST endpoints for columns and tasks (full CRUD)
- [x] Day 7-9: React frontend scaffolding, board UI connected to API
- [x] Day 10: Create-task form
- [x] Day 11-12: Drag-and-drop between columns, board styling
- [x] Day 13: Real-time sync with Socket.io (tasks and columns broadcast live to every connected client)
- [x] Day 14: Full task CRUD in the UI (edit, delete) and column CRUD (add, rename, delete)
- [ ] Day 15: User accounts with JWT (signup/login, protect board routes)
- [ ] Day 16: Polish, deploy, record demo
