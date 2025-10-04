# Daily Weather Forecast - Design Brainstorm

## Overview
Implement multi-day weather forecast feature showing daily weather predictions with dates, temperature ranges, precipitation probability, sunrise/sunset times, and daylight duration.

## Sample Data Reference
See `dailyWeather.json` in root for API response structure from Open-Meteo.

---

## Data & API Design

### 1. Forecast Duration
**Question**: How many days ahead should we fetch and display?
- Sample shows 2 days
- Options:
  - Fixed range (e.g., always 7 days)
  - Configurable ranges (3-day, 7-day, 14-day)
  - User-selectable via query parameter

**Decision**: Ideally we could go for 7 days fixed, but it can be set in an env variable like I already have now, something dev-configurable.

---

### 2. API Endpoint Structure
**Question**: How should we expose this in the API?

**Options**:
- **A) Separate endpoint**
  ```
  GET /weather/forecast?city=chennai&days=7
  ```
  - Pros: Clean separation, dedicated caching
  - Cons: Extra endpoint to maintain

- **B) Query parameter on existing endpoint**
  ```
  GET /weather?city=chennai&include_forecast=true
  ```
  - Pros: Single endpoint, combined response
  - Cons: Response size increases, mixed concerns

- **C) Completely new endpoint path**
  ```
  GET /forecast?city=chennai&days=7
  ```
  - Pros: Clear separation, RESTful
  - Cons: Separate city lookup logic

**Decision**: Since the forecast data that we will receive is also, under the hood, a city's weather data, it makes sense to me to put that in a endpoint like /weather/forecast, which will avoid city lookup calls in a different places and only the logic where we make the API call will be in a different place (since it is a different url in open meteo). Feel free to share your thoughts also.

---

### 3. Caching Strategy
**Question**: How should we cache daily forecast data?

**Considerations**:
- Current weather cache: 15-minute intervals
- Daily forecast changes less frequently
- Trade-off: freshness vs API quota

**Options**:
- Same 15-minute cache as current weather
- Longer cache (1-6 hours) for daily data
- Separate cache keys: `current:{city}:{timestamp}` vs `forecast:{city}:{timestamp}`
- Different TTL per cache type

**Decision**: Do we need to worry about caching right now, or can we do it once the API and some basic frontend is up and running, because that is what I did for the current weather data.

---

## Data Structure & Transformation

### 4. Response Format
**Question**: How should we structure the forecast data in responses?

**Current API Format** (parallel arrays):
```json
{
  "daily": {
    "time": ["2025-10-04", "2025-10-05"],
    "temperature_2m_max": [32.7, 32.7],
    "temperature_2m_min": [26.1, 26.3],
    "precipitation_probability_max": [75, 48]
  }
}
```

**Option A - Transform to array of objects**:
```json
{
  "forecast": [
    {
      "date": "2025-10-04",
      "temp_max": 32.7,
      "temp_min": 26.1,
      "precipitation_max": 75,
      "precipitation_min": 0,
      "sunrise": "2025-10-04T05:58",
      "sunset": "2025-10-04T17:57",
      "daylight_duration": 43115.30
    }
  ]
}
```

**Option B - Keep parallel arrays**:
- Lighter payload
- More complex client-side processing

**Option C - Offer both**:
- Query param: `?format=objects` or `?format=arrays`

**Decision**: Well, for ease in the frontend, I would prefer just mapping a whole array and have the logic for each element/object in the array in a separate component, so array of objects would be an ideal solution, which means we would have to transform the response.

---

### 5. Units & Calculated Fields
**Question**: What additional processing should we do on the data?

**Available from API**:
- Temperature max/min (actual & apparent/feels-like)
- Precipitation probability max/min
- Weather code
- Sunrise/sunset (ISO8601)
- Daylight duration (seconds)

**Potential Enhancements**:
- Temperature range spread: `max - min`
- Daylight duration formatted: `11h 58m 35s` instead of `43115.30s`
- Weather code translated to human description
- Precipitation likelihood category: "Low", "Medium", "High"
- Temperature trend indicators: ↑↓→

**Decision**: Temperature range spread is already there, but it different fields, let it be that way for now. The daylight duration can be returned in seconds and later converted in frontend (that is what I have done my whole career, but you tell me why the other way). Also the weather code translation is already being done, so we could use that. Precipitation probaility comes in percentage (min & max), which I am a little confused as to how I am gonna show them in frontend (definitely not like 10% - 40%).
I'm not sure what the temperature trend means, lets leave it for another day maybe.

---

## UI/UX Implementation

### 6. CLI Display Format
**Question**: How should the Go CLI present multi-day forecasts?

**Option A - Table Format**:
```
| Date       | Max Temp | Min Temp | Rain % | Sunrise  | Sunset   | Daylight |
| ---------- | -------- | -------- | ------ | -------- | -------- | -------- |
| 2025-10-04 | 32.7°C   | 26.1°C   | 75%    | 05:58 AM | 05:57 PM | 11h 58m  |
| 2025-10-05 | 32.7°C   | 26.3°C   | 48%    | 05:58 AM | 05:56 PM | 11h 57m  |
```

**Option B - Card/Block per Day**:
```
┌─ Friday, October 4, 2025 ────────────────┐
│ Temperature: 26.1°C - 32.7°C             │
│ Precipitation: 0-75% chance              │
│ Sunrise: 05:58 AM  Sunset: 05:57 PM     │
│ Daylight: 11h 58m 35s                    │
└──────────────────────────────────────────┘
```

**Option C - Compact List**:
```
Oct 4: 26-33°C, 75% rain, ☀️ 5:58-17:57 (11h 58m)
Oct 5: 26-33°C, 48% rain, ☀️ 5:58-17:56 (11h 57m)
```

**Decision**: Not to be implemented any time soon.

---

### 7. Frontend Display (Next.js)
**Question**: How should we present forecast in the web UI?

**Option A - Horizontal Scrollable Cards**:
- Modern, mobile-friendly
- Similar to weather apps
- Good for 7+ days

**Option B - Vertical List**:
- Traditional, accessible
- Good for desktop
- Easy to scan

**Option C - Expandable Accordion**:
- Compact initially
- Click to see full details per day
- Good for lots of data

**Option D - Grid Layout**:
- 3-4 columns on desktop
- 1-2 on mobile
- Visual overview

**Decision**: I like the horizantal layout, but not the scrollable part. Neither the vertical. It would be nice with a grid layout but expandable accordion also seems cool. Let's do something that involves both, but not an accordion, instead a hover card (Surf through the shadcn component library and bring some cool ideas)

---

### 8. Feature Integration
**Question**: How should forecast relate to current weather?

**Option A - Always Shown Together**:
- Single view with current + forecast
- Seamless experience
- Might be overwhelming

**Option B - Separate View/Tab**:
- Toggle between "Current" and "Forecast"
- Cleaner, focused views
- Extra click required

**Option C - User Preference**:
- Settings to show/hide forecast
- Flexible but adds complexity

**Option D - Responsive Based on Screen Size**:
- Mobile: separate tabs
- Desktop: side-by-side

**Decision**: Lets do it in a separate page for now, then we could think of something later. Because anyway the data structure endpoints are going to be different I guess. We could re-use the input, submit button, error, states etc or maybe just code it again and think of re-usability later.

---

## Technical Implementation Considerations

### Go Backend (server/pkg/weather/)
- New struct types for daily forecast
- API call to Open-Meteo with `daily=...` parameters
- Transform parallel arrays to structured response
- Cache implementation with appropriate TTL
- Error handling for API failures

### Go CLI
- New command flag or subcommand for forecast
- Formatting/display logic
- Color-coded output (temperatures, precipitation)

### Next.js Frontend
- New TypeScript types matching Go structs
- React components for forecast display
- State management for forecast data
- Loading/error states
- Responsive design

### Redis Caching
- Cache key strategy for forecast vs current
- TTL configuration
- Cache invalidation logic

---

## Open Questions

1. Should we support temperature units (°C vs °F)? -- We already have that (but leave it for now, its easier later down the line, bcoz we have the implementation)
2. Do we need historical comparison ("warmer than usual")? -- Complex, not anytime soon.
3. Should we highlight "best day" or "worst day" in the forecast? -- Just labelling, maybe after the feature is a bit done both in backend and UI.
4. Do we want notifications/alerts for significant weather changes? -- Not anytime soon.
5. Should the CLI support saving favorite cities with auto-forecast? -- No changes in cli for now.
6. Accessibility: screen reader support for frontend? -- Bro, really?😂
7. Should we show confidence/reliability indicators? -- What the hell is that?
8. Mobile app considerations for future? -- Waaaayyyyy down the line, maybe.

---

## Next Steps

Once decisions are made:
1. Define Go struct types
2. Implement API endpoint
3. Add caching layer
4. Build CLI display
5. Create frontend components
6. Write tests
7. Update documentation

---

**Created**: 2025-10-04
**Status**: Brainstorming
