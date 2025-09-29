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
  licenseNumber: z.string().optional(),
  nationality: z.string().optional(),
  dateOfBirth: z.string().optional(),
  licenseType: z.string().optional(),
  licenseIssueDate: z.string().optional(),
  licenseExpiryDate: z.string().optional(),
  totalFlights: z.number(),
  totalHours: z.number(),
  dayHours: z.number().optional(),
  nightHours: z.number().optional(),
  picHours: z.number().optional(),
  sicHours: z.number().optional(),
  ifrHours: z.number().optional(),
  flights: z.array(FlightSchema),
    // NEW fields produced by the ingester
  aircraftTypes: z.array(z.string()).optional(),
  lastFlightDate: z.string().optional(),

});

export const MetricsSchema = z.object({
  pilots: z.array(PilotSchema),
});

export type Flight = z.infer<typeof FlightSchema>;
export type Pilot = z.infer<typeof PilotSchema>;
export type Metrics = z.infer<typeof MetricsSchema>;