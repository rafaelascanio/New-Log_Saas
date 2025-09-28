"use client";

export default function CertificationsCard() {
  const items = [
    { label: "Solo Flight Endorsement", ok: true },
    { label: "Medical Certificate: Valid", ok: true },
    { label: "IFR Currency: 2 months left", ok: true },
    { label: "Flight Review Due Soon", ok: false },
  ];

  return (
    <div className="rounded-2xl border p-5">
      <h2 className="text-xl font-semibold mb-3">Certifications &amp; Endorsements</h2>
      <ul className="space-y-2 text-sm">
        {items.map((it, i) => (
          <li key={i} className="flex items-center gap-2">
            <span className={`inline-block h-2 w-2 rounded-full ${it.ok ? "bg-green-500" : "bg-yellow-500"}`} />
            <span>{it.label}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
