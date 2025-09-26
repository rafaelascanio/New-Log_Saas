import { z } from 'zod';

export const FlightSchema = z.object({
  date: z.string().optional(),
  aircraft: z.string(),
  hours: z.number(),
  route: z.string(),
});

export const PilotSchema = z.object({
  id: z.string(),
  name: z.string(),
  totalFlights: z.number(),
  totalHours: z.number(),
  lastFlightDate: z.string().optional(),
  aircraftTypes: z.array(z.string()),
  flights: z.array(FlightSchema),
});

export const MetricsSchema = z.object({
  generatedAt: z.string(),
  summary: z.object({
    totalFlights: z.number(),
    totalHours: z.number(),
  }),
  pilots: z.array(PilotSchema),
});

export type Flight = z.infer<typeof FlightSchema>;
export type Pilot = z.infer<typeof PilotSchema>;
export type Metrics = z.infer<typeof MetricsSchema>;