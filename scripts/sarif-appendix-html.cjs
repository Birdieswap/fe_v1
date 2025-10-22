const fs = require("fs");

const args = process.argv.slice(2);
const opts = {};
for (let i = 0; i < args.length; i += 2) {
  const k = args[i],
    v = args[i + 1];
  if (k && k.startsWith("--")) opts[k.slice(2)] = v;
}
const inPath = opts.in || "combined.sarif";
const outPath = opts.out || "appendix.sarif.html";

function esc(s) {
  return String(s ?? "").replace(
    /[&<>"']/g,
    (m) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[
        m
      ])
  );
}

const doc = JSON.parse(fs.readFileSync(inPath, "utf8"));
const runs = Array.isArray(doc.runs) ? doc.runs : [];

let html = "";
html += "<h2>Appendix: Detailed SARIF Findings</h2>";
if (runs.length === 0) {
  html += "<p><em>No runs in SARIF.</em></p>";
} else {
  for (const [ri, run] of runs.entries()) {
    const tool = run?.tool?.driver?.name || run?.tool?.name || `run #${ri + 1}`;
    const version = run?.tool?.driver?.version || "";
    const results = Array.isArray(run.results) ? run.results : [];
    html += `<h3>${esc(tool)} ${version ? "(" + esc(version) + ")" : ""}</h3>`;
    if (results.length === 0) {
      html += "<p><em>No results.</em></p>";
      continue;
    }
    html += `<table><thead><tr>
      <th>#</th><th>Severity</th><th>Rule</th><th>Message</th><th>Location</th>
    </tr></thead><tbody>`;
    results.forEach((r, idx) => {
      const sev = (
        r.level ||
        r.properties?.severity ||
        r.properties?.problem?.severity ||
        "note"
      ).toUpperCase();
      const ruleId = r.ruleId || r.rule?.id || "";
      const msg = r.message?.text || "";
      let loc = "";
      const loc0 = r.locations?.[0]?.physicalLocation;
      if (loc0?.artifactLocation?.uri) {
        const uri = loc0.artifactLocation.uri;
        const reg = loc0.region;
        const line = reg?.startLine ? `:${reg.startLine}` : "";
        loc = `${uri}${line}`;
      }
      html += `<tr>
        <td>${idx + 1}</td>
        <td><span class="pill sev-${esc(sev)}">${esc(sev)}</span></td>
        <td>${esc(ruleId)}</td>
        <td>${esc(msg)}</td>
        <td><code>${esc(loc)}</code></td>
      </tr>`;
    });
    html += `</tbody></table>`;
  }
}

const shell = (body) => `<!doctype html><html><head><meta charset="utf-8">
<title>Appendix</title>
<style>
body{font-family:system-ui,Segoe UI,Arial,sans-serif;margin:24px}
table{border-collapse:collapse;width:100%;margin:12px 0}
th,td{border:1px solid #ddd;padding:8px}th{background:#f6f8fa;text-align:left}
.pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;margin-right:6px}
.sev-CRITICAL{background:#b60205;color:#fff}.sev-HIGH{background:#d93f0b;color:#fff}
.sev-MEDIUM{background:#fbca04}.sev-LOW{background:#0e8a16;color:#fff}.sev-NOTE{background:#0366d6;color:#fff}
</style></head><body>${body}</body></html>`;

fs.writeFileSync(outPath, shell(html));
console.log(`Wrote ${outPath}`);
EOF;
