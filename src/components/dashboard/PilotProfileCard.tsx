"use client";

type Flight = {
  date?: string;
  hours?: number;
  route?: string;
  aircraftReg?: string;
  aircraft?: string;
};

type Pilot = {
  id: string;
  name: string;
  totalFlights: number;
  totalHours: number;
  lastFlightDate?: string;
  flights?: Flight[];

  // Newly ingested optional fields
  licenseNumber?: string;
  nationality?: string;
  dateOfBirth?: string;
  licenseType?: string;
  licenseIssueDate?: string;
  licenseExpiryDate?: string;
};

export default function PilotProfileCard({ pilot }: { pilot: Pilot }) {
  // Prefer values from the metrics; fall back to em-dash if missing
  const licenseNumber = pilot.licenseNumber ?? "—";
  const nationality = pilot.nationality ?? "—";
  const dob = pilot.dateOfBirth ?? "—";
  const licenseType = pilot.licenseType ?? "—";
  const issueDate = pilot.licenseIssueDate ?? "—";
  const expiryDate = pilot.licenseExpiryDate ?? "—";

  // This was previously hard-coded; keep as a simple placeholder until you provide a real calc
  const atplProgress = "—";

  return (
    <div className="rounded-2xl border p-5 space-y-4">
      <h2 className="text-xl font-semibold">Pilot Profile</h2>
      <div className="space-y-1 text-sm">
        <div>
          <span className="font-medium">Name:</span> {pilot.name}
        </div>
        <div>
          <span className="font-medium">License Number:</span> {licenseNumber}
        </div>
        <div>
          <span className="font-medium">Nationality:</span> {nationality}
        </div>
        <div>
          <span className="font-medium">Date of Birth:</span> {dob}
        </div>
        <div>
          <span className="font-medium">License Type:</span> {licenseType}
        </div>
        <div>
          <span className="font-medium">License Issue Date:</span> {issueDate}
        </div>
        <div>
          <span className="font-medium">License Expiry Date:</span> {expiryDate}
        </div>
      </div>
      <div className="text-sm opacity-70">{atplProgress} towards ATPL requirements</div>
    </div>
  );
}
