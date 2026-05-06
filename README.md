# Digital Bookshelf

电子书架全栈 Web 应用基础架构。

## Project Structure

```text
backend/   Go + Gin + GORM + MySQL + JWT API
frontend/  React + TypeScript + Tailwind CSS app
```

## Backend

```bash
cd backend
cp .env.example .env
go mod tidy
go run ./cmd/server
```

The API defaults to `http://localhost:8080`.

## Frontend

```bash
cd frontend
npm install
npm run dev
```

The frontend defaults to `http://localhost:5173`.
