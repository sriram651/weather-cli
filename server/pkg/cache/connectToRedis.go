package cache

import (
	"fmt"
	"log"
	"os"
	"weather-cli/server/pkg/weather"
)

func ConnectToRedis() *Client {
	useRedisCache := os.Getenv("USE_REDIS_CACHE")
	if useRedisCache == "" {
		// Default to false if not set
		useRedisCache = "false"
	}

	if useRedisCache == "true" {
		log.Println("⌛  Initiating connection to Redis...")

		// Initialize Redis cache
		// Read Redis configuration from environment variables with defaults
		redisHost := os.Getenv("REDIS_HOST")
		redisPort := os.Getenv("REDIS_PORT")

		if redisHost == "" {
			log.Fatal("⚠️  REDIS_HOST not set in .env")
		}

		if redisPort == "" {
			log.Fatal("⚠️  REDIS_PORT not set in .env")
		}

		// Construct Redis address from host and port
		redisAddr := fmt.Sprintf("%s:%s", redisHost, redisPort)

		// Empty if no password
		redisPassword := os.Getenv("REDIS_PASSWORD")

		log.Printf("Connecting to Redis at %s...", redisAddr)

		cacheClient, err := NewClient(redisAddr, redisPassword, 0)
		if err != nil {
			log.Printf("⚠️  Failed to connect to Redis: %v", err)
			log.Printf("⚠️  Running WITHOUT cache - API calls will not be cached")
			return nil
		}

		log.Printf("✅ Redis connected successfully")
		// Set the cache client for weather package to use
		weather.SetCacheClient(cacheClient)
		return cacheClient
	}

	log.Println("⚠️  USE_REDIS_CACHE is false or not set in .env - Running WITHOUT cache")
	return nil
}
