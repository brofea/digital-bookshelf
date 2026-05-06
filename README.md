<div align="center">
    <img src="./assets/logo.png" width="120" />
    <h1>Digital Bookshelf</h1>
    <p>一个电子书架全栈 Web 应用</p>
    <p>
        <a href="https://www.gnu.org/licenses/gpl-3.0.en.html">
            <img src="https://img.shields.io/badge/license-GPL--3.0-green" />
        </a>
        <a href="https://github.com/brofea">
            <img src="https://img.shields.io/badge/brofea-brofea?label=GitHub&logo=github&color=purple" alt="GitHub Profile">
        </a>
    </p>
</div>

一个电子书架全栈 Web 应用

## 功能

- 在线浏览书籍
- 仿真的翻页动画
- 登陆管理员账户可以管理书籍

## 项目结构：

- `backend/`：Go 语言编写的后端 API，使用 Gin 框架
- `frontend/`：使用 React 和 Vite 构建的前端应用

## 快速开始

### 后端

首先配置数据库，参考 [后端 README](./backend/README.md)


```bash
cd backend
cp .env.example .env
go mod tidy
go run ./cmd/server
```

API 默认运行在 `http://localhost:8080`.

### 前端

```bash
cd frontend
npm install
npm run dev
```

前端默认运行在 `http://localhost:5173`.
