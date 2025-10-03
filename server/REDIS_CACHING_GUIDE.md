# Redis Caching Implementation Guide

## Table of Contents
1. [What is Redis?](#what-is-redis)
2. [Why Use Redis for Caching?](#why-use-redis-for-caching)
3. [Architecture Overview](#architecture-overview)
4. [Implementation Details](#implementation-details)
5. [Code Explanations](#code-explanations)
6. [How the Cache Works](#how-the-cache-works)
7. [Testing and Verification](#testing-and-verification)
8. [Best Practices](#best-practices)

---

## What is Redis?

**Redis** (Remote Dictionary Server) is an open-source, in-memory data structure store that can be used as:
- Database
- Cache
- Message broker
- Streaming engine

### Key Characteristics:
- **In-Memory**: Data stored in RAM → extremely fast (sub-millisecond latency)
- **Key-Value Store**: Simple data model → `key: "weather:mumbai:2025-10-03T10:00:00Z"`, `value: "{json data}"`
- **Persistence Options**: Can save to disk for durability
- **TTL Support**: Keys can auto-expire after a set time
- **Single-threaded**: Simple concurrency model, very predictable

---

## Why Use Redis for Caching?

### Our Use Case: Weather API
- **Problem**: Open-Meteo API updates every 15 minutes (10:00, 10:15, 10:30, 10:45)
- **Waste**: Multiple requests within same 15-min window fetch identical data
- **Solution**: Cache the response and reuse it for 15 minutes

### Benefits:
1. **Reduced API Calls**: Save money, avoid rate limits
2. **Faster Response**: ~1-5ms (Redis) vs ~200-500ms (HTTP API call)
3. **Lower Latency**: Better user experience
4. **API Resilience**: If Open-Meteo is down, cached data still works

### Performance Comparison:
```
Without Cache:
Request 1 → API call (500ms)
Request 2 → API call (500ms)  ❌ Unnecessary!
Request 3 → API call (500ms)  ❌ Unnecessary!

With Cache:
Request 1 → API call (500ms) → Cache it
Request 2 → Redis (2ms)       ✅ 250x faster!
Request 3 → Redis (2ms)       ✅ 250x faster!
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                      Client Request                         │
│              GET /weather?city=mumbai                       │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│                   Go HTTP Handler                           │
│              weatherHandler(w, r)                           │
└────────────────────────┬────────────────────────────────────┘
                         │
                         ▼
┌─────────────────────────────────────────────────────────────┐
│              weather.GetWeather(ctx, city)                  │
│                                                             │
│   ┌──────────────────────────────────────────────┐          │
│   │  1. Check Redis Cache                        │          │
│   │     Key: weather:mumbai:2025-10-03T10:00:00Z │          │
│   └──────────────┬───────────────────────────────┘          │
│                  │                                          │
│         ┌────────┴────────┐                                 │
│         │                 │                                 │
│    Cache HIT         Cache MISS                             │
│         │                 │                                 │
│         │                 ▼                                 │
│         │    ┌─────────────────────────┐                    │
│         │    │ Call Open-Meteo API     │                    │
│         │    │ (200-500ms)             │                    │
│         │    └──────────┬──────────────┘                    │
│         │               │                                   │
│         │               ▼                                   │
│         │    ┌─────────────────────────┐                    │
│         │    │ Store in Redis          │                    │
│         │    │ TTL: 15 minutes         │                    │
│         │    └──────────┬──────────────┘                    │
│         │               │                                   │
│         └───────────────┴─────────────┐                     │
│                                       │                     │
│                                        ▼                    │
│                         ┌──────────────────────┐            │
│                         │ Return Response      │            │
│                         └──────────────────────┘            │
└─────────────────────────────────────────────────────────────┘
```

---

## Implementation Details

### File Structure
```
server/
├── main.go                    # Redis initialization, HTTP server
├── pkg/
│   ├── cache/
│   │   └── redis.go          # Redis client wrapper
│   └── weather/
│       └── weather.go         # Weather API with cache integration
└── REDIS_CACHING_GUIDE.md    # This file
```

### Dependencies Added
```bash
go get github.com/redis/go-redis/v9
```

This is the official Redis client for Go, providing:
- Connection pooling
- Automatic reconnection
- Context support (timeouts, cancellation)
- Type-safe commands

---

## Code Explanations

### 1. Cache Package (`server/pkg/cache/redis.go`)

#### Client Initialization
```go
func NewClient(addr, password string, db int) (*Client, error) {
    rdb := redis.NewClient(&redis.Options{
        Addr:     addr,      // "localhost:6379"
        Password: password,  // "" for no password
        DB:       db,        // 0 = default database
    })

    // Test connection with ping
    ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
    defer cancel()

    if err := rdb.Ping(ctx).Err(); err != nil {
        return nil, fmt.Errorf("failed to connect to Redis: %w", err)
    }

    return &Client{rdb: rdb}, nil
}
```

**Explanation:**
- `redis.NewClient()`: Creates a Redis client (connection pool)
- `Ping()`: Tests the connection (like "Hello, are you there?")
- `context.WithTimeout()`: If Redis doesn't respond in 5s, fail fast
- Returns error if connection fails → enables graceful degradation

---

#### Time Rounding Logic
```go
func roundTo15Min(t time.Time) time.Time {
    minute := t.Minute()                    // Get current minute (0-59)
    roundedMinute := (minute / 15) * 15     // Round down to 0, 15, 30, 45

    // Return time with rounded minute, zero seconds/nanoseconds
    return time.Date(t.Year(), t.Month(), t.Day(), t.Hour(),
                     roundedMinute, 0, 0, t.Location())
}
```

**Explanation:**
This is the **core of our caching strategy**!

**Examples:**
- `10:07:23` → `minute = 7` → `(7 / 15) * 15 = 0` → **10:00:00**
- `10:18:45` → `minute = 18` → `(18 / 15) * 15 = 15` → **10:15:00**
- `10:32:59` → `minute = 32` → `(32 / 15) * 15 = 30` → **10:30:00**

**Why?**
All requests within the same 15-minute window use the **same cache key**, so:
- Request at 10:07 and 10:14 → both use key `weather:mumbai:10:00`
- Request at 10:15 → uses new key `weather:mumbai:10:15`

---

#### Cache Key Generation
```go
func buildKey(city string, t time.Time) string {
    rounded := roundTo15Min(t)
    return fmt.Sprintf("weather:%s:%s", city,
                       rounded.UTC().Format(time.RFC3339))
}
```

**Example Keys:**
```
weather:mumbai:2025-10-03T10:00:00Z
weather:delhi:2025-10-03T10:15:00Z
weather:bangalore:2025-10-03T10:30:00Z
```

**Why UTC?**
- Consistent across timezones
- `RFC3339` format is ISO 8601 standard (human-readable)

---

#### Get from Cache
```go
func (c *Client) Get(ctx context.Context, city string) ([]byte, error) {
    key := buildKey(city, time.Now())

    val, err := c.rdb.Get(ctx, key).Result()
    if err == redis.Nil {
        // Cache miss - key doesn't exist
        return nil, nil
    }
    if err != nil {
        // Redis error (network issue, etc.)
        return nil, fmt.Errorf("redis get failed: %w", err)
    }

    return []byte(val), nil
}
```

**Explanation:**
- `redis.Nil`: Special error meaning "key not found" → **Cache MISS**
- Returns `nil, nil` on cache miss (not an error, just not cached yet)
- Returns actual error if Redis is down/unreachable
- Context allows timeout/cancellation

---

#### Set to Cache
```go
func (c *Client) Set(ctx context.Context, city string, data interface{}) error {
    key := buildKey(city, time.Now())

    // Marshal data to JSON
    jsonData, err := json.Marshal(data)
    if err != nil {
        return fmt.Errorf("failed to marshal data: %w", err)
    }

    // Set with 15-minute expiration (TTL)
    err = c.rdb.Set(ctx, key, jsonData, 15*time.Minute).Err()
    if err != nil {
        return fmt.Errorf("redis set failed: %w", err)
    }

    return nil
}
```

**Explanation:**
- `json.Marshal()`: Convert Go struct to JSON string
- `15*time.Minute`: TTL (Time To Live) - Redis auto-deletes key after 15 minutes
- **Why TTL?**
  - Prevents stale data (weather updates every 15 min)
  - Automatic cleanup (no manual deletion needed)
  - Memory management (old data doesn't accumulate)

**Redis Command Executed:**
```redis
SET weather:mumbai:2025-10-03T10:00:00Z '{"city":"mumbai",...}' EX 900
```
(`EX 900` = expire in 900 seconds = 15 minutes)

---

### 2. Weather Package Integration (`server/pkg/weather/weather.go`)

#### Cache Interface
```go
type CacheClient interface {
    Get(ctx context.Context, city string) ([]byte, error)
    Set(ctx context.Context, city string, data interface{}) error
}

var cacheClient CacheClient

func SetCacheClient(client CacheClient) {
    cacheClient = client
}
```

**Why Interface?**
- **Dependency Injection**: Decouples weather logic from Redis specifics
- **Testability**: Can mock the cache for unit tests
- **Flexibility**: Could swap Redis for Memcached/DynamoDB without changing weather code
- **Optional**: If `cacheClient == nil`, caching is disabled

**Design Pattern:** This is the **Dependency Injection** pattern

---

#### Cache Check (Get)
```go
func GetWeather(ctx context.Context, city string) (WeatherResp, error) {
    cityKey := strings.ToLower(strings.TrimSpace(city))

    // Try cache first if cache client is configured
    if cacheClient != nil {
        cached, err := cacheClient.Get(ctx, cityKey)
        if err != nil {
            // Log error but continue to API call
            log.Printf("Cache get error for %s: %v", cityKey, err)
        } else if cached != nil {
            // Cache hit! Unmarshal and return
            var resp WeatherResp
            if err := json.Unmarshal(cached, &resp); err == nil {
                log.Printf("Cache HIT for %s", cityKey)
                return resp, nil  // ← Early return! No API call!
            }
            log.Printf("Cache data unmarshal error for %s: %v", cityKey, err)
        }
        // Cache miss - continue to API call
        log.Printf("Cache MISS for %s", cityKey)
    }

    // ... rest of function: fetch from Open-Meteo API ...
}
```

**Flow:**
1. **Check if cache is enabled** (`cacheClient != nil`)
2. **Try to get from cache**
   - If error → log but continue (don't break the app)
   - If `cached != nil` → Cache HIT → unmarshal JSON → **return immediately** ✅
   - If `cached == nil` → Cache MISS → continue to API call
3. **No early return?** → Proceed to Open-Meteo API call

**Error Handling Strategy:**
- Cache errors are **non-fatal** (logged but ignored)
- If Redis is down, app still works (just slower)
- This is **graceful degradation**

---

#### Cache Store (Set)
```go
out := WeatherResp{
    City:   city,
    TempC:  raw.Current.Temperature,
    // ... other fields ...
}

// Store in cache if cache client is configured
if cacheClient != nil {
    if err := cacheClient.Set(ctx, cityKey, out); err != nil {
        // Log error but don't fail the request
        log.Printf("Cache set error for %s: %v", cityKey, err)
    } else {
        log.Printf("Cached weather data for %s", cityKey)
    }
}

return out, nil
```

**Explanation:**
- After successful API call, store result in cache
- If cache fails to store → log error but **still return the data**
- User gets correct data even if caching fails
- Next request will just be a cache miss (not ideal, but not broken)

---

### 3. Main Server (`server/main.go`)

```go
func main() {
    // Read Redis config from environment variables
    redisAddr := os.Getenv("REDIS_ADDR")
    if redisAddr == "" {
        redisAddr = "localhost:6379"  // Default
    }
    redisPassword := os.Getenv("REDIS_PASSWORD")

    log.Printf("Connecting to Redis at %s...", redisAddr)
    cacheClient, err := cache.NewClient(redisAddr, redisPassword, 0)
    if err != nil {
        log.Printf("⚠️  Failed to connect to Redis: %v", err)
        log.Printf("⚠️  Running WITHOUT cache - API calls will not be cached")
    } else {
        log.Printf("✅ Redis connected successfully")
        weather.SetCacheClient(cacheClient)  // Inject cache into weather package
        defer cacheClient.Close()            // Clean shutdown
    }

    http.HandleFunc("/weather", weatherHandler)
    addr := ":8080"
    log.Printf("🚀 Go Server started, listening on http://localhost%s/", addr)
    log.Fatal(http.ListenAndServe(addr, nil))
}
```

**Key Points:**
1. **Environment Variables**: `REDIS_ADDR`, `REDIS_PASSWORD` for configuration
2. **Graceful Degradation**: If Redis fails, server still starts (just without cache)
3. **Dependency Injection**: `weather.SetCacheClient(cacheClient)` wires up the cache
4. **Defer Close**: Ensures Redis connection closes cleanly on shutdown
5. **12-Factor App**: Configuration via environment (not hardcoded)

---

## How the Cache Works

### Scenario 1: First Request (Cache Miss)
```
Time: 10:07:23
Request: GET /weather?city=mumbai

1. Generate key: roundTo15Min(10:07:23) → 10:00:00
   Key = "weather:mumbai:2025-10-03T10:00:00Z"

2. Check Redis: GET weather:mumbai:2025-10-03T10:00:00Z
   Result: (nil) ← Key doesn't exist

3. Log: "Cache MISS for mumbai"

4. Call Open-Meteo API (500ms) ← Slow but necessary

5. Store in Redis:
   SET weather:mumbai:2025-10-03T10:00:00Z '{"city":"mumbai",...}' EX 900

6. Log: "Cached weather data for mumbai"

7. Return response to client
```

---

### Scenario 2: Second Request (Cache Hit)
```
Time: 10:12:45
Request: GET /weather?city=mumbai

1. Generate key: roundTo15Min(10:12:45) → 10:00:00
   Key = "weather:mumbai:2025-10-03T10:00:00Z"  ← Same key!

2. Check Redis: GET weather:mumbai:2025-10-03T10:00:00Z
   Result: '{"city":"mumbai","temp_c":27,...}' ← Found it!

3. Unmarshal JSON to WeatherResp struct

4. Log: "Cache HIT for mumbai"

5. Return response to client (2ms) ← 250x faster!

No API call! 🎉
```

---

### Scenario 3: Request After 15 Minutes
```
Time: 10:17:00
Request: GET /weather?city=mumbai

1. Generate key: roundTo15Min(10:17:00) → 10:15:00
   Key = "weather:mumbai:2025-10-03T10:15:00Z"  ← Different key!

2. Check Redis: GET weather:mumbai:2025-10-03T10:15:00Z
   Result: (nil) ← New time window, key doesn't exist yet

3. Cache MISS → Call API → Cache new data with key ending in 10:15:00Z

Plus, the old key (10:00:00Z) has expired (TTL expired), so Redis auto-deleted it.
```

---

## Testing and Verification

### 1. Start Redis
```bash
# Windows (if installed via MSI)
redis-server

# Or check if running as service
net start Redis
```

### 2. Start Your Server
```bash
cd server
go run main.go
```

You should see:
```
Connecting to Redis at localhost:6379...
✅ Redis connected successfully
🚀 Go Server started, listening on http://localhost:8080/
```

### 3. Test Cache Behavior
```bash
# First request - Cache MISS
curl "http://localhost:8080/weather?city=mumbai"

# Check server logs:
# Cache MISS for mumbai
# Cached weather data for mumbai

# Second request - Cache HIT
curl "http://localhost:8080/weather?city=mumbai"

# Check server logs:
# Cache HIT for mumbai
```

### 4. Inspect Redis Directly
```bash
# Install Redis CLI tools (if not installed)
redis-cli

# In Redis CLI:
> KEYS weather:*
1) "weather:mumbai:2025-10-03T10:00:00Z"

> GET weather:mumbai:2025-10-03T10:00:00Z
"{\"city\":\"mumbai\",\"temp_c\":27,...}"

> TTL weather:mumbai:2025-10-03T10:00:00Z
(integer) 847  ← Seconds remaining until expiration
```

---

## Best Practices

### 1. **Always Use Context**
```go
// ✅ Good - respects timeouts and cancellation
ctx, cancel := context.WithTimeout(r.Context(), 15*time.Second)
defer cancel()
resp, err := weather.GetWeather(ctx, city)

// ❌ Bad - can hang forever
resp, err := weather.GetWeather(context.Background(), city)
```

### 2. **Graceful Degradation**
Your app should work even if Redis is down:
```go
if cacheClient != nil {
    // Try cache, but don't fail if it errors
}
// Always fallback to API call
```

### 3. **Appropriate TTL**
- **Too short** (e.g., 1 min): Cache barely helps, still many API calls
- **Too long** (e.g., 1 hour): Stale data, users see outdated weather
- **Just right** (15 min): Matches API update frequency ✅

### 4. **Key Naming Convention**
Use hierarchical keys for easy management:
```
weather:mumbai:2025-10-03T10:00:00Z
weather:delhi:2025-10-03T10:00:00Z
user:session:abc123
metrics:api_calls:2025-10-03
```

This allows:
```bash
KEYS weather:*           # Find all weather cache keys
DEL weather:*            # Delete all weather cache
```

### 5. **Monitor Cache Hit Rate**
Track cache effectiveness:
```go
var cacheHits, cacheMisses int64

// In Get():
if cached != nil {
    atomic.AddInt64(&cacheHits, 1)
} else {
    atomic.AddInt64(&cacheMisses, 1)
}

// Expose via /metrics endpoint
hitRate := float64(cacheHits) / float64(cacheHits + cacheMisses)
```

**Good hit rate:** > 80% means cache is working well!

### 6. **Connection Pooling**
`go-redis` handles this automatically, but be aware:
- Default pool size: 10 connections per CPU
- For high traffic, tune `PoolSize` in `redis.Options`

### 7. **Error Handling Philosophy**
```
Cache errors → Log & continue (non-fatal)
API errors → Return error to user (fatal)
```

Cache is an **optimization**, not a requirement. If it fails, app still works.

---

## Common Issues and Solutions

### Issue 1: "Connection Refused"
```
Error: dial tcp 127.0.0.1:6379: connect: connection refused
```

**Solution:** Redis isn't running
```bash
# Windows
net start Redis
# or
redis-server
```

### Issue 2: "i/o timeout"
```
Error: dial tcp 127.0.0.1:6379: i/o timeout
```

**Solution:** Redis is slow or firewall blocking
- Check Redis is running: `redis-cli ping`
- Check firewall settings

### Issue 3: Cache Always Misses
Check:
1. Is `SetCacheClient()` called in `main()`?
2. Are cache errors being logged? (Check server logs)
3. Is TTL too short?

### Issue 4: Stale Data
If you see old weather data:
- Check cache TTL (should be 15 minutes)
- Verify time rounding logic
- Manually flush cache: `redis-cli FLUSHDB`

---

## Advanced Topics

### Cache Invalidation
Manually clear cache when needed:
```go
func InvalidateCity(ctx context.Context, city string) error {
    // Delete all cache keys for this city
    pattern := fmt.Sprintf("weather:%s:*", city)
    iter := rdb.Scan(ctx, 0, pattern, 0).Iterator()
    for iter.Next(ctx) {
        rdb.Del(ctx, iter.Val())
    }
    return iter.Err()
}
```

### Cache Warming
Pre-populate cache for popular cities:
```go
func WarmCache(ctx context.Context, cities []string) {
    for _, city := range cities {
        go GetWeather(ctx, city)  // Concurrent requests
    }
}
```

### Cache Stampede Prevention
When cache expires, prevent all requests from hitting API simultaneously:
```go
// Use mutex to ensure only one request fetches fresh data
var cityLocks sync.Map

func GetWeather(ctx context.Context, city string) (WeatherResp, error) {
    lock, _ := cityLocks.LoadOrStore(city, &sync.Mutex{})
    mu := lock.(*sync.Mutex)

    mu.Lock()
    defer mu.Unlock()

    // Check cache again (might have been filled while waiting)
    if cached := checkCache(city); cached != nil {
        return cached, nil
    }

    // Fetch and cache
    resp := fetchFromAPI(city)
    setCache(city, resp)
    return resp, nil
}
```

---

## Summary

### What You Learned
1. **Redis Basics**: In-memory key-value store with TTL support
2. **Cache Strategy**: Time-based keys with 15-minute windows
3. **Go Redis Client**: Connection, Get/Set operations, error handling
4. **Integration Pattern**: Dependency injection, graceful degradation
5. **Production Patterns**: Environment config, logging, monitoring

### Key Takeaways
- ✅ Cache is an **optimization**, not a requirement
- ✅ Always implement **graceful degradation**
- ✅ Use **appropriate TTL** to balance freshness and efficiency
- ✅ **Log cache hits/misses** for monitoring
- ✅ Design **cache keys** carefully for easy management

### Next Steps
- Add monitoring/metrics (Prometheus)
- Implement cache warming for popular cities
- Use Redis Cluster for high availability
- Add cache invalidation API endpoint
- Implement distributed locking for cache stampede

---

## Resources

- [Redis Documentation](https://redis.io/docs/)
- [go-redis GitHub](https://github.com/redis/go-redis)
- [Caching Best Practices](https://redis.io/docs/manual/patterns/)
- [The Twelve-Factor App](https://12factor.net/)

---

**Created:** 2025-10-03
**Author:** Weather CLI Redis Integration
**Version:** 1.0
