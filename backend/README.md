# Digital Bookshelf Backend

Gin + GORM + MySQL API for the Digital Bookshelf application.

## Quick Start

1. Create a MySQL database:

```sql
CREATE DATABASE digital_bookshelf CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

2. Copy `.env.example` to `.env` or export matching environment variables.

3. Install Poppler so uploaded PDFs can render first-page covers:

```bash
brew install poppler
```

4. Install dependencies and start the API:

```bash
go mod tidy
go run ./cmd/server
```

## API

- `POST /api/auth/login` with `{ "username": "admin", "password": "admin123" }`
- `GET /api/books`
- `GET /api/books/:id`
- `POST /api/books` admin JWT required
- `POST /api/books/upload` admin JWT required, multipart fields: `title`, `file`
- `PUT /api/books/:id` admin JWT required
- `DELETE /api/books/:id` admin JWT required
- `POST /api/books/:id/cover` admin JWT required, multipart field: `cover`

Uploaded PDFs are saved under `storage/uploads`. First-page cover PNGs are saved
under `storage/covers` through Poppler's `pdftoppm`.
