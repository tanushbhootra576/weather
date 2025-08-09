"use server";

import { summarizeWeather, type SummarizeWeatherInput } from '@/ai/flows/summarize-weather';

export async function getAiWeatherSummary(input: SummarizeWeatherInput): Promise<string> {
  try {
    const result = await summarizeWeather(input);
    return result.summary;
  } catch (error) {
    console.error('Error getting AI summary:', error);
    return 'Could not generate a weather summary at this time. Please try again later.';
  }
}
