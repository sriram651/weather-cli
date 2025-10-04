# Daily Weather Forecast - Implementation Plan

## Design Decisions Summary

### 1. Forecast Duration
**Decision**: 7 days fixed, configurable via environment variable

**Rationale**:
- Keeps it flexible for dev/prod environments
- Follows existing pattern with env configuration
- No hardcoded values
- Easy to adjust without code changes

**Implementation**:
- Add `FORECAST_DAYS` env variable (default: 7)
- Read in server initialization
- Pass to Open-Meteo API call

---

### 2. API Endpoint Structure
**Decision**: `/weather/forecast` endpoint

**Rationale**:
- Forecast data is fundamentally city weather data
- Reuses existing city lookup logic (DRY principle)
- Only the Open-Meteo API call differs (uses `daily=...` params instead of `current=...`)
- Clear, RESTful path structure
- Logical grouping under `/weather` namespace

**Implementation**:
```
GET /weather/forecast?city=chennai
```

---

### 3. Caching Strategy
**Decision**: Implement later, after basic feature is working

**Rationale**:
- Same approach used successfully for current weather
- Get feature working first, optimize later
- Avoid premature optimization
- Can learn from actual usage patterns before deciding cache TTL

**Future Considerations**:
- Likely longer TTL than current weather (1-6 hours vs 15 minutes)
- Separate cache keys: `forecast:{city}:{timestamp}`
- Different expiration strategy for daily data

---

### 4. Response Format
**Decision**: Transform API response to array of daily forecast objects

**Rationale**:
- Much easier to work with in frontend (simple `.map()`)
- No juggling parallel arrays on client side
- Cleaner component code
- Better type safety with TypeScript
- Standard pattern for REST APIs

**API Response Structure**:
```json
{
  "city": "chennai",
  "forecast": [
    {
      "date": "2025-10-04",
      "temp_max": 32.7,
      "temp_min": 26.1,
      "apparent_temp_max": 40.2,
      "apparent_temp_min": 32.1,
      "precipitation_probability_max": 75,
      "precipitation_probability_min": 0,
      "weather_code": 96,
      "description": "Thunderstorm with slight or moderate hail",
      "sunrise": "2025-10-04T05:58",
      "sunset": "2025-10-04T17:57",
      "daylight_duration": 43115.30
    },
    // ... more days
  ]
}
```

---

### 5. Units & Calculated Fields

#### Temperature Ranges
**Decision**: Keep as separate `temp_max` and `temp_min` fields
- Already available from API
- Frontend can calculate spread if needed
- Keep data structure simple

#### Daylight Duration
**Decision**: Return raw seconds from API, format in frontend
- Standard practice (formatting on client side)
- Keeps backend response lean
- Frontend has more control over display format
- Less backend processing

**Note**: If CLI display is needed later, formatting logic might move to backend for reusability.

#### Weather Code Translation
**Decision**: Translate in backend using existing `loadWeatherCodes()` function
- Reuse existing functionality
- Single source of truth
- Consistent with current weather endpoint

#### Precipitation Probability Display
**Decision**: Return both min and max, frontend decides display strategy

**Frontend Display Options** (to be decided during UI implementation):
- **Option A**: Show only max: "Up to 75% chance of rain"
- **Option B**: Range with label: "10-40%" + badge (Low/Moderate/High)
- **Option C**: Max as main display, min in hover/detail view
- **Option D**: Visual progress bar instead of numbers
- **Option E**: Combination of the above

**Thresholds for Labels** (if using badges):
- Low: 0-30%
- Moderate: 31-60%
- High: 61-100%

#### Temperature Trend Indicators
**Decision**: Not implementing for now
- Would show day-to-day comparison (e.g., "2°C warmer than yesterday")
- Adds complexity
- Can be added as enhancement later

---

### 6. CLI Display Format
**Decision**: Not implementing CLI changes in initial release

**Rationale**:
- Focus on server + frontend first
- CLI can be added as separate enhancement
- Server API will already support it

---

### 7. Frontend Display (Next.js)
**Decision**: Grid layout with hover interactions

**UI Components** (using shadcn/ui):
- **Grid Layout**: Responsive grid of forecast cards
  - Desktop: 3-4 columns
  - Tablet: 2 columns
  - Mobile: 1 column
- **Card Component**: Base container for each day
- **Hover Card**: Show detailed info on hover/click
  - Feels like/apparent temperatures
  - Full sunrise/sunset times with formatted labels
  - Detailed weather description
  - Exact precipitation range
- **Badge**: Precipitation level indicators (Low/Moderate/High)
- **Progress Bar**: Visual precipitation probability
- **Separator**: Between metric sections in cards

**Card Content** (visible by default):
- Date (formatted: "Friday, Oct 4")
- Temperature range: "26°C - 33°C"
- Weather icon + description
- Precipitation probability (visual + percentage)
- Sunrise/sunset icons with times

**Hover Card Content** (on hover/click):
- Feels like temperature range
- Detailed weather code description
- Exact precipitation min-max range
- Daylight duration (formatted)
- Any additional metadata

**Design Philosophy**:
- Clean, scannable overview in grid
- Details on demand via hover
- Mobile-friendly (tap for details)
- Not horizontally scrollable (full grid visible)
- Not purely vertical (takes advantage of screen width)

---

### 8. Feature Integration
**Decision**: Separate page/route for forecast

**Route**: `/forecast`

**Rationale**:
- Keep features focused and simple initially
- Different data structure and endpoint
- Easier to develop and test independently
- Can refactor for integration later

**Code Reuse Strategy**:
- Reuse input component for city search
- Reuse submit button patterns
- Reuse error handling logic
- Reuse loading states
- **BUT**: Copy-paste for now, extract common components later when duplication is clear

**Future Integration Options** (post-MVP):
- Side-by-side on desktop
- Tabs to switch between current/forecast
- Responsive: separate on mobile, combined on desktop
- Link from current weather page to forecast

---

## Open Questions - Addressed

1. **Temperature units (°C vs °F)?**
   - Already implemented for current weather
   - Can add to forecast later using same logic
   - Keep simple for MVP

2. **Historical comparison ("warmer than usual")?**
   - Too complex for initial release
   - Requires historical data
   - Future enhancement

3. **Highlight "best day" or "worst day"?**
   - Nice labeling feature
   - Add after core feature is complete
   - Low priority enhancement

4. **Notifications/alerts for weather changes?**
   - Out of scope for now
   - Requires push notification infrastructure
   - Far future consideration

5. **CLI support for forecast?**
   - Not in initial release
   - Server API will support it
   - Can add later

6. **Accessibility (screen readers)?**
   - Semantic HTML covers most of it
   - Use proper ARIA labels where needed
   - Not a specific focus but follow best practices

7. **Confidence/reliability indicators?**
   - Not available from Open-Meteo API
   - Not implementing

8. **Mobile app considerations?**
   - Way down the line
   - Not relevant to current implementation

---

## Technical Implementation Plan

### Phase 1: Backend (Go Server)

#### 1.1 Define Struct Types
**File**: `server/pkg/weather/weather.go`

```go
// DailyForecast represents a single day's forecast
type DailyForecast struct {
    Date                       string  `json:"date"`
    TempMax                    float64 `json:"temp_max"`
    TempMin                    float64 `json:"temp_min"`
    ApparentTempMax            float64 `json:"apparent_temp_max"`
    ApparentTempMin            float64 `json:"apparent_temp_min"`
    PrecipitationProbabilityMax int     `json:"precipitation_probability_max"`
    PrecipitationProbabilityMin int     `json:"precipitation_probability_min"`
    WeatherCode                int     `json:"weather_code"`
    Description                string  `json:"description"`
    Sunrise                    string  `json:"sunrise"`
    Sunset                     string  `json:"sunset"`
    DaylightDuration           float64 `json:"daylight_duration"`
}

// ForecastResp is the response for the forecast endpoint
type ForecastResp struct {
    City     string          `json:"city"`
    Forecast []DailyForecast `json:"forecast"`
}
```

#### 1.2 Implement GetWeatherForecast Function
**File**: `server/pkg/weather/weather.go`

**Function Signature**:
```go
func GetWeatherForecast(ctx context.Context, city string, days int) (ForecastResp, error)
```

**Implementation Steps**:
1. Validate city parameter (reuse existing validation)
2. Look up city coordinates (reuse `readCities()`)
3. Build Open-Meteo URL with `daily` parameters:
   ```
   https://api.open-meteo.com/v1/forecast?
     latitude={lat}&longitude={lon}&
     timezone=auto&
     forecast_days={days}&
     daily=temperature_2m_max,temperature_2m_min,
           apparent_temperature_max,apparent_temperature_min,
           precipitation_probability_max,precipitation_probability_min,
           weather_code,sunrise,sunset,daylight_duration
   ```
4. Make HTTP request to Open-Meteo
5. Parse response (parallel arrays structure)
6. Transform to array of `DailyForecast` objects
7. Translate weather codes using `loadWeatherCodes()`
8. Return `ForecastResp`

**Error Handling**:
- Reuse existing error types: `ErrCitiesUnavailable`, `ErrCityNotFound`
- Add context to upstream API errors

#### 1.3 Add HTTP Endpoint
**File**: `server/main.go` (or wherever routes are defined)

**Endpoint**: `GET /weather/forecast`

**Query Parameters**:
- `city` (required): City name
- `days` (optional): Number of forecast days (default from env var)

**Handler Logic**:
1. Extract city from query params
2. Get forecast days from query param or env var default
3. Validate parameters
4. Call `GetWeatherForecast()`
5. Return JSON response
6. Handle errors appropriately (404 for city not found, 500 for other errors)

**Example**:
```go
http.HandleFunc("/weather/forecast", func(w http.ResponseWriter, r *http.Request) {
    city := r.URL.Query().Get("city")
    if city == "" {
        http.Error(w, "city parameter required", http.StatusBadRequest)
        return
    }

    days := getForecastDays() // from env var

    forecast, err := weather.GetWeatherForecast(r.Context(), city, days)
    if err != nil {
        // handle errors...
        return
    }

    w.Header().Set("Content-Type", "application/json")
    json.NewEncoder(w).Encode(forecast)
})
```

#### 1.4 Environment Variable
**File**: `.env` or environment config

```bash
FORECAST_DAYS=7
```

Read in server initialization.

---

### Phase 2: Frontend (Next.js)

#### 2.1 Define TypeScript Types
**File**: `frontend/src/types/responses.ts`

```typescript
export interface DailyForecast {
  date: string;
  temp_max: number;
  temp_min: number;
  apparent_temp_max: number;
  apparent_temp_min: number;
  precipitation_probability_max: number;
  precipitation_probability_min: number;
  weather_code: number;
  description: string;
  sunrise: string;
  sunset: string;
  daylight_duration: number;
}

export interface ForecastResp {
  city: string;
  forecast: DailyForecast[];
}
```

#### 2.2 Create Forecast Page
**File**: `frontend/src/app/forecast/page.tsx`

**Structure**:
- City input (reuse pattern from current weather)
- Submit button
- Loading state
- Error handling
- Forecast grid display

**State Management**:
```typescript
const [city, setCity] = useState('');
const [forecast, setForecast] = useState<ForecastResp | null>(null);
const [loading, setLoading] = useState(false);
const [error, setError] = useState<string | null>(null);
```

**API Call**:
```typescript
const fetchForecast = async () => {
  setLoading(true);
  setError(null);

  try {
    const res = await fetch(`http://localhost:8080/weather/forecast?city=${city}`);
    if (!res.ok) throw new Error('City not found');
    const data: ForecastResp = await res.json();
    setForecast(data);
  } catch (err) {
    setError(err.message);
  } finally {
    setLoading(false);
  }
};
```

#### 2.3 Create Forecast Components

**Component Structure**:
```
ForecastGrid
├── ForecastCard (per day)
    ├── CardHeader (date)
    ├── CardContent (temp, weather, precipitation)
    └── HoverCard (detailed info)
```

**File**: `frontend/src/components/ForecastCard.tsx`

**Props**:
```typescript
interface ForecastCardProps {
  forecast: DailyForecast;
}
```

**Card Content** (visible):
- Formatted date: `formatDate(forecast.date)` → "Friday, Oct 4"
- Temperature range: `${forecast.temp_min}°C - ${forecast.temp_max}°C`
- Weather icon (based on weather_code)
- Description: `forecast.description`
- Precipitation: Progress bar + percentage
- Sunrise/sunset with icons

**Hover Card Content**:
- Feels like: `${forecast.apparent_temp_min}°C - ${forecast.apparent_temp_max}°C`
- Precipitation range: `${forecast.precipitation_probability_min}% - ${forecast.precipitation_probability_max}%`
- Daylight duration: `formatDaylightDuration(forecast.daylight_duration)` → "11h 58m"

**File**: `frontend/src/components/ForecastGrid.tsx`

```typescript
export function ForecastGrid({ forecast }: { forecast: DailyForecast[] }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {forecast.map((day) => (
        <ForecastCard key={day.date} forecast={day} />
      ))}
    </div>
  );
}
```

#### 2.4 Utility Functions
**File**: `frontend/src/lib/utils.ts` (or new file)

**Format Date**:
```typescript
export function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  });
}
```

**Format Daylight Duration**:
```typescript
export function formatDaylightDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
}
```

**Get Precipitation Level**:
```typescript
export function getPrecipitationLevel(probability: number): 'low' | 'moderate' | 'high' {
  if (probability <= 30) return 'low';
  if (probability <= 60) return 'moderate';
  return 'high';
}
```

**Get Weather Icon**:
```typescript
export function getWeatherIcon(weatherCode: number): string {
  // Map weather codes to icon names or emoji
  // Reuse logic from current weather if available
}
```

#### 2.5 Styling with shadcn/ui
Install required components:
```bash
npx shadcn-ui@latest add card hover-card badge progress separator
```

Use Tailwind for responsive grid and spacing.

---

### Phase 3: Testing & Refinement

#### 3.1 Backend Testing
- Test with different cities
- Test with invalid cities (404 handling)
- Test API timeout scenarios
- Verify data transformation from parallel arrays
- Check weather code translations
- Validate JSON response structure

#### 3.2 Frontend Testing
- Test loading states
- Test error states (invalid city, network error)
- Test responsive grid on different screen sizes
- Test hover interactions
- Verify date/time formatting
- Check precipitation level badges
- Validate accessibility (keyboard navigation, screen readers)

#### 3.3 Integration Testing
- End-to-end flow: input city → fetch → display
- Cross-browser testing
- Mobile device testing

---

### Phase 4: Future Enhancements (Post-MVP)

#### Caching
- Implement Redis caching for forecast data
- Cache key: `forecast:{city}:{timestamp}`
- TTL: 1-6 hours (longer than current weather)
- Consider cache warming for popular cities

#### CLI Support
- Add `--forecast` flag to CLI
- Implement table or card display format
- Reuse backend API

#### UI Enhancements
- "Best day" / "Worst day" highlighting
- Temperature trend indicators (day-to-day comparison)
- Animated weather icons
- Charts/graphs for temperature trends
- More detailed precipitation visualization

#### Feature Integration
- Combine current weather + forecast on one page
- Responsive layout (tabs on mobile, side-by-side on desktop)
- Quick links between current and forecast views

#### Code Refactoring
- Extract common components (input, button, error display)
- Create shared hooks (useFetch, useWeather)
- Consolidate API client logic
- Type safety improvements

#### Performance Optimization
- Lazy loading for forecast page
- Image optimization for weather icons
- Code splitting
- Memoization of expensive calculations

---

## Implementation Checklist

### Backend
- [ ] Add `FORECAST_DAYS` environment variable
- [ ] Define `DailyForecast` struct
- [ ] Define `ForecastResp` struct
- [ ] Implement `GetWeatherForecast()` function
  - [ ] City lookup (reuse existing)
  - [ ] Build Open-Meteo URL
  - [ ] Make HTTP request
  - [ ] Parse response
  - [ ] Transform parallel arrays to object array
  - [ ] Translate weather codes
  - [ ] Error handling
- [ ] Add `/weather/forecast` endpoint
  - [ ] Query parameter parsing
  - [ ] Handler logic
  - [ ] JSON response
  - [ ] Error responses
- [ ] Test backend with various cities
- [ ] Verify response structure

### Frontend
- [ ] Define TypeScript types (`DailyForecast`, `ForecastResp`)
- [ ] Create `/forecast` page
  - [ ] City input
  - [ ] Submit handler
  - [ ] Loading state
  - [ ] Error handling
- [ ] Implement utility functions
  - [ ] `formatDate()`
  - [ ] `formatDaylightDuration()`
  - [ ] `getPrecipitationLevel()`
  - [ ] `getWeatherIcon()`
- [ ] Create `ForecastCard` component
  - [ ] Card layout
  - [ ] Temperature display
  - [ ] Weather icon + description
  - [ ] Precipitation display (progress bar + badge)
  - [ ] Sunrise/sunset
- [ ] Create `HoverCard` with detailed info
  - [ ] Feels like temperatures
  - [ ] Precipitation range
  - [ ] Daylight duration
- [ ] Create `ForecastGrid` component
  - [ ] Responsive grid layout
  - [ ] Map over forecast array
- [ ] Install shadcn/ui components
- [ ] Style with Tailwind CSS
- [ ] Test on different screen sizes
- [ ] Test interactions (hover, click)

### Polish
- [ ] Cross-browser testing
- [ ] Mobile device testing
- [ ] Accessibility check
- [ ] Error message improvements
- [ ] Loading skeleton/spinner
- [ ] Empty state handling
- [ ] Documentation updates

### Future
- [ ] Implement caching
- [ ] CLI support
- [ ] Integrate with current weather page
- [ ] Refactor common components
- [ ] Performance optimization

---

## Notes & Learnings

### Precipitation Probability Display
Decision pending during UI implementation. Options to try:
1. Single value (max): "Up to 75% chance"
2. Range with badge: "10-40%" + colored badge
3. Visual progress bar with max value
4. Combination: bar + badge

Test with real data to see what feels most intuitive.

### Daylight Duration Formatting
Returning raw seconds from backend, formatting in frontend.
If CLI support is added later, consider moving format logic to backend for reuse.

### Weather Code Translation
Already have `loadWeatherCodes()` in backend - reuse this.
Single source of truth for weather descriptions.

### Component Reusability
Starting with duplication (copy-paste from current weather page).
Will refactor common components once duplication patterns are clear.
Avoid premature abstraction.

### Responsive Design
Grid collapses naturally with Tailwind breakpoints:
- `grid-cols-1` (mobile)
- `md:grid-cols-2` (tablet)
- `lg:grid-cols-3` (desktop)
- `xl:grid-cols-4` (large desktop)

### API Design Philosophy
Keep backend lean - return structured data.
Frontend handles presentation logic (formatting, styling).
Backend handles business logic (data fetching, transformation, validation).

---

**Created**: 2025-10-04
**Status**: Ready for implementation
**Next Action**: Begin Phase 1 - Backend Implementation
