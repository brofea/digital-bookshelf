package router

import (
	"log"
	"net/http"

	"digital-bookshelf/backend/internal/config"
	"digital-bookshelf/backend/internal/handlers"
	"digital-bookshelf/backend/internal/middleware"
	"digital-bookshelf/backend/internal/services"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
	"gorm.io/gorm"
)

func New(cfg config.Config, db *gorm.DB) *gin.Engine {
	if cfg.AppEnv == "production" {
		gin.SetMode(gin.ReleaseMode)
	}

	authService, err := services.NewAuthService(cfg)
	if err != nil {
		log.Fatalf("create auth service: %v", err)
	}
	bookService := services.NewBookService(cfg, db)

	authHandler := handlers.NewAuthHandler(authService)
	bookHandler := handlers.NewBookHandler(bookService)

	r := gin.Default()
	r.Use(cors.New(cors.Config{
		AllowOrigins:     []string{"http://localhost:5173", "http://127.0.0.1:5173"},
		AllowMethods:     []string{"GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"},
		AllowHeaders:     []string{"Authorization", "Content-Type"},
		AllowCredentials: true,
	}))

	r.Static("/storage", "storage")

	api := r.Group("/api")
	api.GET("/health", func(c *gin.Context) {
		c.JSON(http.StatusOK, gin.H{"status": "ok"})
	})
	api.POST("/auth/login", authHandler.Login)
	api.GET("/books", bookHandler.List)
	api.GET("/books/:id", bookHandler.Get)

	admin := api.Group("")
	admin.Use(middleware.RequireAdmin(authService))
	admin.POST("/books", bookHandler.Create)
	admin.POST("/books/upload", bookHandler.Upload)
	admin.PUT("/books/:id", bookHandler.Update)
	admin.DELETE("/books/:id", bookHandler.Delete)
	admin.POST("/books/:id/cover", bookHandler.UploadCover)

	return r
}
