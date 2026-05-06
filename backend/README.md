# Digital Bookshelf Backend

## 快速开始

1. 创建一个 MySQL 数据库，例如：

```sql
CREATE DATABASE digital_bookshelf CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

1. 创建一个数据库用户并授予权限，例如：

```sql
CREATE USER 'dbuser'@'localhost' IDENTIFIED BY 'dbpass';
GRANT ALL PRIVILEGES ON digital_bookshelf.* TO 'dbuser'@'localhost';
FLUSH PRIVILEGES;
```

1. 复制 `.env.example` 到 `.env` 并修改 `DB_DSN` 以匹配你的数据库连接字符串，例如：

```
DB_DSN=dbuser:dbpass@tcp(localhost:3306)/digital_bookshelf?charset=utf8mb4&parseTime=True&loc=Local
```


1. 安装 Poppler（用于 PDF 转 PNG）

```bash
brew install poppler
```

1. 安装依赖并启动：

```bash
go mod tidy
go run ./cmd/server
```

## Quick Start

1. Create a MySQL database, for example:

```sql
CREATE DATABASE digital_bookshelf CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

1. Create a database user and grant privileges, for example:

```sql
CREATE USER 'dbuser'@'localhost' IDENTIFIED BY 'dbpass';
GRANT ALL PRIVILEGES ON digital_bookshelf.* TO 'dbuser'@'localhost';
FLUSH PRIVILEGES;
```

3. Copy `.env.example` to `.env` and modify DB_DSN to match your database connection string, for example:

```
DB_DSN=dbuser:dbpass@tcp(localhost:3306)/digital_bookshelf?charset=utf8mb4&parseTime=True&loc=Local
```


4. Install Poppler (for PDF to PNG conversion)

```bash
brew install poppler
```

1. Install dependencies and start:

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
