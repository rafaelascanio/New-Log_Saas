import { z } from "zod";

export type DecimalHours = number;

export const RawCsvRowSchema = z
  .object({
    "Pilot Full Name": z.string().optional(),
    "License Number": z.string().optional(),
    Nationality: z.string().optional(),
    "Date of Birth": z.string().optional(),
    "License Type": z.string().optional(),
    "Issuing Authority": z.string().optional(),
    "License Issue Date": z.string().optional(),
    "License Expiry Date": z.string().optional(),
    "Flight Date": z.string().optional(),
    "Aircraft Registration": z.string().optional(),
    "Aircraft Make/Model": z.string().optional(),
    "Aircraft Type": z.string().optional(),
    "Aircraft Model": z.string().optional(),
    "Simulator Device": z.string().optional(),
    "Simulator Device/Type": z.string().optional(),
    "Route From (ICAO)": z.string().optional(),
    "Route To (ICAO)": z.string().optional(),
    "Total Flight Time (HH:MM)": z.string().optional(),
    "Aircraft LSA": z.string().optional(),
    "Aircraft Single Engine": z.string().optional(),
    "Aircraft Multi Engine": z.string().optional(),
    "Aircraft Turboprop": z.string().optional(),
    "Aircraft Turbojet": z.string().optional(),
    "Aircraft Helicopter": z.string().optional(),
    "Aircraft Glider": z.string().optional(),
    "Aircraft Ultralight Motorized": z.string().optional(),
    "Aircraft Ultralight Non-Motorized": z.string().optional(),
    "Day Time (HH:MM)": z.string().optional(),
    "Night Time (HH:MM)": z.string().optional(),
    "IFR Time (HH:MM)": z.string().optional(),
    "Approach Type": z.string().optional(),
    "Approach Count": z.string().optional(),
    "Simulator Type": z.string().optional(),
    "Simulator Time (HH:MM)": z.string().optional(),
    "Cross Country Time (HH:MM)": z.string().optional(),
    "Solo Time (HH:MM)": z.string().optional(),
    "PIC Time (HH:MM)": z.string().optional(),
    "SIC Time (HH:MM)": z.string().optional(),
    "Dual Received (HH:MM)": z.string().optional(),
    "Instructor Time (HH:MM)": z.string().optional(),
    Remarks: z.string().optional(),
    "Certification Type": z.string().optional(),
    "Issued By": z.string().optional(),
    "Certification Issue Date": z.string().optional(),
    "Certification Valid Until": z.string().optional(),
    "Certification Description": z.string().optional(),
    "Certification Status": z.string().optional(),
    Role: z.string().optional(),
    Rules: z.string().optional(),
  })
  .passthrough();

export type RawCsvRow = z.infer<typeof RawCsvRowSchema>;

const FlightViewSchema = z
  .object({
    date: z.string().optional(),
    aircraft: z.string().optional(),
    aircraftReg: z.string().optional(),
    route: z.string().optional(),
    hours: z.union([z.number(), z.string()]).optional(),
    role: z.string().optional(),
    rules: z.string().optional(),
    night: z.boolean().optional(),
    approachType: z.string().optional(),
    approachCount: z.union([z.number(), z.string()]).optional(),
    simulatorType: z.string().optional(),
    simulatorTime: z.union([z.number(), z.string()]).optional(),
    crossCountryTime: z.union([z.number(), z.string()]).optional(),
    soloTime: z.union([z.number(), z.string()]).optional(),
    picTime: z.union([z.number(), z.string()]).optional(),
    sicTime: z.union([z.number(), z.string()]).optional(),
    dualReceived: z.union([z.number(), z.string()]).optional(),
    instructorTime: z.union([z.number(), z.string()]).optional(),
    remarks: z.string().optional(),
  })
  .passthrough();

const PilotViewSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    licenseNumber: z.string().optional(),
    nationality: z.string().optional(),
    dateOfBirth: z.string().optional(),
    licenseType: z.string().optional(),
    licenseIssueDate: z.string().optional(),
    licenseExpiryDate: z.string().optional(),
    totalFlights: z.number().optional(),
    totalHours: z.number().optional(),
    dayHours: z.number().optional(),
    nightHours: z.number().optional(),
    picHours: z.number().optional(),
    sicHours: z.number().optional(),
    ifrHours: z.number().optional(),
    aircraftTypes: z.array(z.string()).optional(),
    lastFlightDate: z.string().optional(),
    flights: z.array(FlightViewSchema).optional(),
  })
  .passthrough();

export const MetricsViewSchema = z.object({
  pilots: z.array(PilotViewSchema),
});

export type MetricsView = z.infer<typeof MetricsViewSchema>;

const SummarySchema = z.object({
  totalFlights: z.number(),
  totalHours: z.number(),
});

export const MetricsDataSchema = z.object({
  generatedAt: z.string().optional(),
  summary: SummarySchema.optional(),
  pilots: z.array(PilotViewSchema).optional(),
});

export type MetricsData = z.infer<typeof MetricsDataSchema>;

export type PilotIdentity = {
  id: string;
  name: string;
  licenseNumber?: string;
  nationality?: string;
  dateOfBirth?: string;
  licenseType?: string;
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
};

export type FlightRow = {
  date: string;
  aircraft?: string;
  aircraftReg?: string;
  route?: string;
  hours: DecimalHours;
  role?: string;
  rules?: string;
  night?: boolean;
  approachType?: string;
  approachCount?: number;
  simulatorType?: string;
  simulatorTime?: DecimalHours;
  crossCountryTime?: DecimalHours;
  soloTime?: DecimalHours;
  picTime?: DecimalHours;
  sicTime?: DecimalHours;
  dualReceived?: DecimalHours;
  instructorTime?: DecimalHours;
  remarks?: string;
};

export type PilotMetricsFull = PilotIdentity & {
  totalFlights: number;
  totalHours: DecimalHours;
  dayHours?: DecimalHours;
  nightHours?: DecimalHours;
  picHours?: DecimalHours;
  sicHours?: DecimalHours;
  ifrHours?: DecimalHours;
  aircraftTypes?: string[];
  lastFlightDate?: string;
  flights: FlightRow[];
};

export type DashboardSummary = {
  totalFlights: number;
  totalHours: DecimalHours;
  updatedAt?: string;
};

export type DashboardMetrics = {
  summary: DashboardSummary;
  pilots: PilotMetricsFull[];
};
