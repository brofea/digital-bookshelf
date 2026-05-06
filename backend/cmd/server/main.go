package main

import (
	"log"

	"digital-bookshelf/backend/internal/config"
	"digital-bookshelf/backend/internal/database"
	"digital-bookshelf/backend/internal/router"
)

func main() {
	cfg := config.Load()

	db, err := database.Connect(cfg)
	if err != nil {
		log.Fatalf("connect database: %v", err)
	}

	if err := database.AutoMigrate(db); err != nil {
		log.Fatalf("migrate database: %v", err)
	}

	r := router.New(cfg, db)
	if err := r.Run(cfg.ServerAddr); err != nil {
		log.Fatalf("run server: %v", err)
	}
}
