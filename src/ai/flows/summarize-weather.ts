'use server';


import {ai} from '@/ai/genkit';
import {z} from 'genkit';

const SummarizeWeatherInputSchema = z.object({
  temperature: z.number().describe('The current temperature in Celsius.'),
  humidity: z.number().describe('The current humidity percentage.'),
  windSpeed: z.number().describe('The current wind speed in kilometers per hour.'),
  conditions: z.string().describe('A description of the current weather conditions (e.g., sunny, cloudy, rainy).'),
});
export type SummarizeWeatherInput = z.infer<typeof SummarizeWeatherInputSchema>;

const SummarizeWeatherOutputSchema = z.object({
  summary: z.string().describe('A short, human-readable summary of the weather forecast for the next few hours.'),
});
export type SummarizeWeatherOutput = z.infer<typeof SummarizeWeatherOutputSchema>;

export async function summarizeWeather(input: SummarizeWeatherInput): Promise<SummarizeWeatherOutput> {
  return summarizeWeatherFlow(input);
}

const prompt = ai.definePrompt({
  name: 'summarizeWeatherPrompt',
  input: {schema: SummarizeWeatherInputSchema},
  output: {schema: SummarizeWeatherOutputSchema},
  prompt: `You are a helpful weather forecaster. You will generate a short, human-readable summary of the weather forecast for the next few hours based on the provided data.

Current Weather Data:
Temperature: {{{temperature}}}°C
Humidity: {{{humidity}}}%
Wind Speed: {{{windSpeed}}} km/h
Conditions: {{{conditions}}}

Summary: `,
});

const summarizeWeatherFlow = ai.defineFlow(
  {
    name: 'summarizeWeatherFlow',
    inputSchema: SummarizeWeatherInputSchema,
    outputSchema: SummarizeWeatherOutputSchema,
  },
  async input => {
    const {output} = await prompt(input);
    return output!;
  }
);
