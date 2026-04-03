import { NextResponse } from 'next/server';

// WMO Weather interpretation codes → emoji + label
function weatherInfo(code: number): { emoji: string; label: string } {
  if (code === 0)               return { emoji: '☀️',  label: 'Clear' };
  if (code === 1)               return { emoji: '🌤️', label: 'Mostly Clear' };
  if (code === 2)               return { emoji: '⛅',  label: 'Partly Cloudy' };
  if (code === 3)               return { emoji: '☁️',  label: 'Overcast' };
  if (code <= 48)               return { emoji: '🌫️', label: 'Foggy' };
  if (code <= 57)               return { emoji: '🌦️', label: 'Drizzle' };
  if (code <= 67)               return { emoji: '🌧️', label: 'Rain' };
  if (code <= 77)               return { emoji: '❄️',  label: 'Snow' };
  if (code <= 82)               return { emoji: '🌦️', label: 'Showers' };
  if (code <= 99)               return { emoji: '⛈️',  label: 'Thunderstorm' };
  return { emoji: '🌡️', label: 'Unknown' };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const city = searchParams.get('city')?.trim();
  if (!city) return NextResponse.json({ error: 'no city' }, { status: 400 });

  try {
    // 1. Geocoding (Open-Meteo, free, no key)
    const geoRes = await fetch(
      `https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=en&format=json`,
      { next: { revalidate: 86400 } }
    );
    const geoData = await geoRes.json();
    const loc = geoData.results?.[0];
    if (!loc) return NextResponse.json({ error: 'city not found' }, { status: 404 });

    // 2. Current weather (Open-Meteo, free, no key)
    const wxRes = await fetch(
      `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current=temperature_2m,weather_code,wind_speed_10m&wind_speed_unit=kmh&timezone=auto`,
      { next: { revalidate: 1800 } } // 30min cache
    );
    const wxData = await wxRes.json();
    const cur = wxData.current;
    const { emoji, label } = weatherInfo(cur.weather_code);

    return NextResponse.json({
      emoji,
      label,
      temp: Math.round(cur.temperature_2m),
      wind: Math.round(cur.wind_speed_10m),
      city: loc.name,
      country: loc.country_code,
    });
  } catch (e) {
    return NextResponse.json({ error: 'fetch failed' }, { status: 500 });
  }
}
