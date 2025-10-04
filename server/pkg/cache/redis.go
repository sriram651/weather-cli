package cache

import (
	"context"
	"fmt"
	"time"

	"github.com/redis/go-redis/v9"
)

// Client wraps the Redis client for weather caching
type Client struct {
	rdb *redis.Client
}

// NewClient creates a new Redis client connection
// addr: Redis server address (e.g., "localhost:6379")
// password: Redis password (empty string if no password)
// db: Redis database number (0 is default)
func NewClient(addr, password string, db int) (*Client, error) {
	rdb := redis.NewClient(&redis.Options{
		Addr:     addr,
		Password: password,
		DB:       db,
	})

	// Test the connection with a ping
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := rdb.Ping(ctx).Err(); err != nil {
		return nil, fmt.Errorf("failed to connect to Redis: %w", err)
	}

	return &Client{rdb: rdb}, nil
}

// Close closes the Redis connection
func (c *Client) Close() error {
	if c.rdb != nil {
		return c.rdb.Close()
	}
	return nil
}

// roundTo15Min rounds a timestamp down to the nearest 15-minute interval
// Examples:
//   10:07 -> 10:00
//   10:23 -> 10:15
//   10:45 -> 10:45
func roundTo15Min(t time.Time) time.Time {
	// Get minutes since the hour
	minute := t.Minute()

	// Round down to nearest 15-minute interval (0, 15, 30, 45)
	roundedMinute := (minute / 15) * 15

	// Return time with rounded minute and zero seconds/nanoseconds
	return time.Date(t.Year(), t.Month(), t.Day(), t.Hour(), roundedMinute, 0, 0, t.Location())
}

// buildKey creates a cache key for a city and timestamp
// Format: "weather:<city>:<rounded-timestamp>"
// Example: "weather:mumbai:2025-10-03T10:15:00Z"
func buildKey(city string, t time.Time) string {
	rounded := roundTo15Min(t)
	return fmt.Sprintf("weather:%s:%s", city, rounded.UTC().Format(time.RFC3339))
}

// Get retrieves cached weather data for a city at a specific timestamp
// Returns nil if cache miss (key doesn't exist or expired)
func (c *Client) Get(ctx context.Context, city string, at time.Time) ([]byte, error) {
	key := buildKey(city, at)

	val, err := c.rdb.Get(ctx, key).Result()
	if err == redis.Nil {
		// Cache miss - key doesn't exist
		return nil, nil
	}
	if err != nil {
		// Redis error (network, etc.)
		return nil, fmt.Errorf("redis get failed: %w", err)
	}

	return []byte(val), nil
}

// Set stores weather data in cache with 15-minute TTL
// TTL (Time To Live) means Redis will automatically delete the key after 15 minutes
// data should be the raw bytes to cache (e.g., JSON-encoded data)
func (c *Client) Set(ctx context.Context, city string, at time.Time, data []byte) error {
	key := buildKey(city, at)

	// Set with 15-minute expiration
	// After 15 minutes, Redis automatically deletes this key
	err := c.rdb.Set(ctx, key, data, 15*time.Minute).Err()
	if err != nil {
		return fmt.Errorf("redis set failed: %w", err)
	}

	return nil
}
