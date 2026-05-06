package config

import (
	"bufio"
	"os"
	"strconv"
	"strings"
)

type Config struct {
	AppEnv        string
	ServerAddr    string
	DBDSN         string
	JWTSecret     string
	JWTIssuer     string
	JWTTTLHours   int
	AdminUsername string
	AdminPassword string
	UploadDir     string
	CoverDir      string
	PublicBaseURL string
}

func Load() Config {
	loadDotEnv(".env")

	return Config{
		AppEnv:        getEnv("APP_ENV", "development"),
		ServerAddr:    getEnv("SERVER_ADDR", ":8080"),
		DBDSN:         getEnv("DB_DSN", "root:password@tcp(127.0.0.1:3306)/digital_bookshelf?charset=utf8mb4&parseTime=True&loc=Local"),
		JWTSecret:     getEnv("JWT_SECRET", "change-me-in-production"),
		JWTIssuer:     getEnv("JWT_ISSUER", "digital-bookshelf"),
		JWTTTLHours:   getEnvInt("JWT_TTL_HOURS", 24),
		AdminUsername: getEnv("ADMIN_USERNAME", "admin"),
		AdminPassword: getEnv("ADMIN_PASSWORD", "admin123"),
		UploadDir:     getEnv("UPLOAD_DIR", "storage/uploads"),
		CoverDir:      getEnv("COVER_DIR", "storage/covers"),
		PublicBaseURL: getEnv("PUBLIC_BASE_URL", "http://localhost:8080"),
	}
}

func loadDotEnv(path string) {
	file, err := os.Open(path)
	if err != nil {
		return
	}
	defer file.Close()

	scanner := bufio.NewScanner(file)
	for scanner.Scan() {
		line := strings.TrimSpace(scanner.Text())
		if line == "" || strings.HasPrefix(line, "#") {
			continue
		}

		key, value, ok := strings.Cut(line, "=")
		if !ok {
			continue
		}

		key = strings.TrimSpace(key)
		value = strings.Trim(strings.TrimSpace(value), `"'`)
		if key == "" || os.Getenv(key) != "" {
			continue
		}
		_ = os.Setenv(key, value)
	}
}

func getEnv(key string, fallback string) string {
	value := os.Getenv(key)
	if value == "" {
		return fallback
	}
	return value
}

func getEnvInt(key string, fallback int) int {
	raw := os.Getenv(key)
	if raw == "" {
		return fallback
	}
	value, err := strconv.Atoi(raw)
	if err != nil {
		return fallback
	}
	return value
}
