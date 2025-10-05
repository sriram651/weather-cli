package cache

import (
	"log"
	"os"
	"weather-cli/server/pkg/weather"
)

func ConnectToRedis() {
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
		redisAddr := os.Getenv("REDIS_ADDR")

		if redisHost == "" {
			log.Fatal("⚠️  REDIS_HOST not set in .env")
		}

		if redisAddr == "" {
			log.Fatalf("⚠️  REDIS_ADDR not set in .env")
		}

		// Empty if no password
		redisPassword := os.Getenv("REDIS_PASSWORD")

		log.Printf("Connecting to Redis at %s...", redisAddr)

		cacheClient, err := NewClient(redisAddr, redisPassword, 0)
		if err != nil {
			log.Printf("⚠️  Failed to connect to Redis: %v", err)
			log.Printf("⚠️  Running WITHOUT cache - API calls will not be cached")
		} else {
			log.Printf("✅ Redis connected successfully")
			// Set the cache client for weather package to use
			weather.SetCacheClient(cacheClient)
			defer cacheClient.Close()
		}
	} else {
		log.Println("⚠️  USE_REDIS_CACHE is false or not set in .env - Running WITHOUT cache")
	}
}
