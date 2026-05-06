package middleware

import (
	"net/http"
	"strings"

	"digital-bookshelf/backend/internal/services"

	"github.com/gin-gonic/gin"
)

func RequireAdmin(auth *services.AuthService) gin.HandlerFunc {
	return func(c *gin.Context) {
		header := c.GetHeader("Authorization")
		tokenText := strings.TrimSpace(strings.TrimPrefix(header, "Bearer "))
		if tokenText == "" || tokenText == header {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "missing bearer token"})
			return
		}

		claims, err := auth.ParseToken(tokenText)
		if err != nil || claims.Role != "admin" {
			c.AbortWithStatusJSON(http.StatusUnauthorized, gin.H{"error": "invalid token"})
			return
		}

		c.Set("admin", claims.Subject)
		c.Next()
	}
}
