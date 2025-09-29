// scripts/qa-verify.mjs
import { writeFileSync } from "node:fs";
import { request as httpReq } from "node:http";
import { request as httpsReq } from "node:https";
import { URL } from "node:url";

function fetchUrl(url, timeoutMs = 10000) {
  return new Promise((resolve, reject) => {
    const u = new URL(url);
    const reqFn = u.protocol === "https:" ? httpsReq : httpReq;
    const req = reqFn(
      {
        hostname: u.hostname,
        path: u.pathname + (u.search || ""),
        port: u.port || (u.protocol === "https:" ? 443 : 80),
        method: "GET",
        headers: { "User-Agent": "qa-verify/1.0" },
      },
      (res) => {
        let data = "";
        res.on("data", (c) => (data += c));
        res.on("end", () => resolve({ status: res.statusCode || 0, text: data }));
      }
    );
    req.on("error", reject);
    req.setTimeout(timeoutMs, () => {
      req.destroy(new Error("timeout"));
    });
    req.end();
  });
}

function section(title, ok, details = "") {
  return `## ${title}\nStatus: ${ok ? "PASS" : "FAIL"}\n${details ? details + "\n" : ""}`;
}

(async () => {
  const results = [];
  let pass = true;

  // Env
  const base = process.env.NEXT_PUBLIC_BLOB_URL_BASE;
  const hasEnv = !!base;
  results.push(section("Env Check", hasEnv, `NEXT_PUBLIC_BLOB_URL_BASE=${base || "(missing)"}`));
  if (!hasEnv) pass = false;

  // Blob
  let metrics, firstPilot;
  if (hasEnv) {
    try {
      const r = await fetchUrl(`${base.replace(/\/$/, "")}/metrics.json?ts=${Date.now()}`);
      const ok = r.status === 200;
      if (!ok) pass = false;
      results.push(section("Blob Check", ok, `HTTP ${r.status}`));
      if (ok) {
        metrics = JSON.parse(r.text);
        firstPilot = metrics?.pilots?.[0];
      }
    } catch (e) {
      pass = false;
      results.push(section("Blob Check", false, String(e)));
    }
  }

  // App server: multi-pilot
  try {
    const r = await fetchUrl("http://127.0.0.1:3000/");
    let ok = r.status === 200 && r.text.includes("Pilot Logbook");
    if (firstPilot?.name) ok = ok && r.text.includes(firstPilot.name);
    results.push(section("Multi-pilot Page Check", ok, `HTTP ${r.status}`));
    if (!ok) pass = false;
  } catch (e) {
    pass = false;
    results.push(section("Multi-pilot Page Check", false, (e && e.stack) ? e.stack : String(e)));
  }

  // Single-pilot page
  if (firstPilot?.id) {
    try {
      const r = await fetchUrl(`http://127.0.0.1:3000/?pilotId=${encodeURIComponent(firstPilot.id)}`);
      const html = r.text || "";
      const must = [
        "Pilot Profile",
        "Flight Hours Breakdown",
        "Last Flight",
        // accept raw & or &amp;
        /Certifications\s+&(amp;)?\s+Endorsements/,
        "Flight Hours",
      ];

      const ok =
        r.status === 200 &&
        must.every((m) => (m instanceof RegExp ? m.test(html) : html.includes(m)));

      results.push(section("Single-pilot Detail Check", ok, `HTTP ${r.status}`));
      if (!ok) pass = false;
    } catch (e) {
      pass = false;
      results.push(
        section(
          "Single-pilot Detail Check",
          false,
          (e && e.stack) ? e.stack : String(e)
        )
      );
    }
  } else {
    results.push(section("Single-pilot Detail Check", false, "No pilotId in metrics; cannot verify detail view."));
    pass = false;
  }

  const report = `# QA Report\n\n${results.join("\n")}\n\n# Summary\n${pass ? "PASS" : "FAIL"}\n`;
  writeFileSync("QA_REPORT.md", report, "utf8");
  console.log("Wrote QA_REPORT.md");
  process.exit(pass ? 0 : 1);
})();
