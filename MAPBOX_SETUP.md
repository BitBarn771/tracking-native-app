# Mapbox Setup Guide

This app uses Mapbox for mapping functionality. Follow these steps to set up Mapbox:

## 1. Get a Mapbox Access Token

1. Go to [Mapbox](https://account.mapbox.com/access-tokens/)
2. Sign up or log in to your Mapbox account
3. Create a new access token or use your default public token
4. Copy the access token

## 2. Configure the App

1. Open `constants/MapboxConfig.ts`
2. Replace `YOUR_MAPBOX_ACCESS_TOKEN_HERE` with your actual Mapbox access token:

```typescript
export const MAPBOX_ACCESS_TOKEN = 'pk.your_actual_token_here';
```

## 3. Features

The app includes the following features:

- **Geolocation**: Automatically gets and displays the user's current location
- **Interactive Map**: Full Mapbox map with zoom, pan, and touch interactions
- **Polygon Drawing**: Users can draw polygons around their property by tapping points on the map
- **Property Mapping**: Save and manage multiple property boundaries
- **Location Tracking**: Real-time location updates with high accuracy

## 4. Usage

1. **Get Current Location**: Tap the 📍 button to center the map on your current location
2. **Draw Polygon**: 
   - Tap the "✏️ Draw" button to start drawing mode
   - Tap on the map to add points to your polygon
   - Tap "✓ Done" when finished (minimum 3 points required)
3. **Clear Polygon**: Tap "🗑️ Clear" to remove the current polygon
4. **Save Property**: When you complete a polygon, it will be saved automatically

## 5. Permissions

The app requests the following permissions:
- **Location Access**: Required to show your position on the map
- **Foreground Location**: Used while the app is active

## 6. Troubleshooting

- **Map not loading**: Check your Mapbox access token
- **Location not working**: Ensure location permissions are granted
- **Polygon not drawing**: Make sure you're in drawing mode and tap at least 3 points

## 7. Development

To run the app in development:

```bash
npm start
```

Then press 'i' for iOS simulator or 'a' for Android emulator. 