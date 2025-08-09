"use client";

import { useState, useEffect, useCallback, useMemo, type FC } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { getAiWeatherSummary } from './actions';
import { BrainCircuit, Droplets, LoaderCircle, MapPin, Search, Wind } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import Image from 'next/image';

type WeatherData = {
  city: string;
  temperature: number;
  humidity: number;
  windSpeed: number;
  conditions: string;
  icon: string;
};

const WeatherCardSkeleton = () => (
  <Card className="glassmorphism w-full">
    <CardHeader>
      <Skeleton className="h-8 w-2/3" />
      <Skeleton className="h-6 w-1/3" />
    </CardHeader>
    <CardContent className="flex flex-col items-center gap-6 text-center">
      <Skeleton className="h-24 w-24 rounded-full" />
      <Skeleton className="h-10 w-3/4" />
      <div className="flex w-full justify-around">
        <Skeleton className="h-10 w-24" />
        <Skeleton className="h-10 w-24" />
      </div>
    </CardContent>
    <CardFooter className="flex-col items-start gap-4">
      <Separator />
      <Skeleton className="h-6 w-1/4" />
      <div className="space-y-2 w-full">
        <Skeleton className="h-5 w-full" />
        <Skeleton className="h-5 w-5/6" />
      </div>
    </CardFooter>
  </Card>
);

export default function Home() {
  const [weatherData, setWeatherData] = useState<WeatherData | null>(null);
  const [searchCity, setSearchCity] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingAi, setLoadingAi] = useState<boolean>(false);
  const { toast } = useToast();

  const fetchWeather = useCallback(async (query: {city?: string, lat?: number, lon?: number}) => {
    setLoading(true);
   

    try {
      const apiKey = 3574d83253a2553b034a5d84dac6506f;
      if (!apiKey) {
        throw new Error("OpenWeather API key not found.");
      }
      let url = `https://api.openweathermap.org/data/2.5/weather?appid=${apiKey}&units=metric`;
      if (query.city) {
        url += `&q=${query.city}`;
      } else if (query.lat && query.lon) {
        url += `&lat=${query.lat}&lon=${query.lon}`;
      } else {
        setLoading(false);
        return;
      }
      
      const response = await fetch(url);
      if (!response.ok) {
        const errorData = await response.json();
        const message = errorData.message.charAt(0).toUpperCase() + errorData.message.slice(1);
        throw new Error(message || 'City not found');
      }
      const data = await response.json();
      
      const transformedData: WeatherData = {
        city: data.name,
        temperature: Math.round(data.main.temp),
        humidity: data.main.humidity,
        windSpeed: Math.round(data.wind.speed * 3.6), // m/s to km/h
        conditions: data.weather[0]?.main || 'N/A',
        icon: data.weather[0]?.icon
      };

      setWeatherData(transformedData);
    } catch (error) {
      console.error("Failed to fetch weather:", error);
      toast({
        variant: "destructive",
        title: "Error fetching weather",
        description: (error as Error).message || "Could not retrieve weather data.",
      });
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    const getInitialWeather = () => {
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          (position) => {
            toast({ title: "Location found!", description: "Fetching your local weather." });
            fetchWeather({ lat: position.coords.latitude, lon: position.coords.longitude });
          },
          (error) => {
            console.error("Geolocation error:", error);
            toast({
              title: "Location Access Denied",
              description: "Showing weather for Dubai. Enable location or search for a city.",
            });
            fetchWeather({ city: 'Dubai' }); // Default city
          }
        );
      } else {
        toast({
          title: "Geolocation Not Supported",
          description: "Showing weather for London. Please search for a city.",
        });
        fetchWeather({ city: 'London' }); // Default city
      }
    };
    getInitialWeather();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [toast]); // We only want this to run once on mount. fetchWeather is not a dependency.

  useEffect(() => {
    if (weatherData) {
      setLoadingAi(true);
      getAiWeatherSummary({
        temperature: weatherData.temperature,
        humidity: weatherData.humidity,
        windSpeed: weatherData.windSpeed,
        conditions: weatherData.conditions,
      })
    
        .finally(() => setLoadingAi(false));
    }
  }, [weatherData]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchCity.trim()) {
      fetchWeather({ city: searchCity });
    } else {
      toast({ variant: "destructive", title: "Empty search", description: "Please enter a city name." });
    }
  };

  const weatherBackgroundClass = useMemo(() => {
    if (!weatherData) return 'bg-default';
    const condition = weatherData.conditions.toLowerCase();
    if (condition.includes('sun') || condition.includes('clear')) return 'bg-sunny';
    if (condition.includes('cloud')) return 'bg-cloudy';
    if (condition.includes('rain') || condition.includes('drizzle')) return 'bg-rainy';
    if (condition.includes('snow')) return 'bg-snowy';
    return 'bg-default';
  }, [weatherData]);
  
  useEffect(() => {
    document.body.className = `font-body antialiased weather-bg ${weatherBackgroundClass}`;
  }, [weatherBackgroundClass]);

  return (
    <main className="flex min-h-screen w-full flex-col items-center p-4 pt-12 sm:p-8 sm:pt-24 transition-all duration-500">
      <div className="w-full max-w-md space-y-8">
        <header className="text-center">
          <h1 className="text-5xl font-bold text-foreground drop-shadow-md">WeatherVerse</h1>
          <p className="text-muted-foreground mt-2">Your universe of weather, summarized by AI</p>
        </header>

        <form onSubmit={handleSearch} className="flex w-full gap-2">
          <Input
            type="text"
            placeholder="Search for a city..."
            value={searchCity}
            onChange={(e) => setSearchCity(e.target.value)}
            className="flex-1 text-base bg-background/50 focus:bg-background/70"
            disabled={loading}
          />
          <Button type="submit" size="icon" disabled={loading}>
            {loading ? <LoaderCircle className="animate-spin" /> : <Search />}
          </Button>
        </form>

        <div className="animate-in fade-in zoom-in-95 duration-500">
          {loading && !weatherData && <WeatherCardSkeleton />}
          {weatherData && (
            <Card className="glassmorphism text-foreground w-full overflow-hidden">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-3xl">
                  <MapPin className="h-7 w-7"/>
                  {weatherData.city}
                </CardTitle>
                <CardDescription className="text-lg">{weatherData.conditions}</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col items-center gap-6 text-center">
                 {weatherData.icon && (
                  <Image
                    src={`https://openweathermap.org/img/wn/${weatherData.icon}@4x.png`}
                    alt={weatherData.conditions}
                    width={128}
                    height={128}
                    className="h-32 w-32 drop-shadow-lg"
                  />
                )}
                <p className="text-7xl font-bold">{weatherData.temperature}°C</p>
                <div className="flex w-full justify-around">
                  <div className="flex items-center gap-2">
                    <Droplets className="h-6 w-6 text-primary" />
                    <p className="text-lg">{weatherData.humidity}%</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Wind className="h-6 w-6 text-primary" />
                    <p className="text-lg">{weatherData.windSpeed} km/h</p>
                  </div>
                </div>
              </CardContent>
              {/* <CardFooter className="flex-col items-start gap-4 pt-6">
                <Separator />
                <h3 className="flex items-center gap-2 text-xl font-semibold">
                  <BrainCircuit className="h-6 w-6 text-primary" />
                  AI Summary
                </h3>
                {loadingAi ? (
                  <div className="w-full space-y-2">
                    <Skeleton className="h-4 w-full" />
                    <Skeleton className="h-4 w-5/6" />
                  </div>
                ) : (
                  <p className="text-muted-foreground">{aiSummary}</p>
                )}
              </CardFooter> */}
            </Card>
          )}
        </div>
      </div>
    </main>
  );
}
