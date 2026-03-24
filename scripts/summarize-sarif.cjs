#!/usr/bin/env node
/**
 * summarize-sarif.js
 * 사용법:
 *   node scripts/summarize-sarif.js --in sarif_in --combined combined.sarif \
 *     --zapBaselineDir zap_baseline --zapFullDir zap_full --out summary.html
 */
const fs = require("fs");
const path = require("path");

const args = process.argv.slice(2);
function arg(name, def) {
  const i = args.indexOf(`--${name}`);
  return i >= 0 ? args[i + 1] : def;
}

const inDir = arg("in", "sarif_in");
const combinedPath = arg("combined", "combined.sarif");
const zapBaselineDir = arg("zapBaselineDir", "zap_baseline");
const zapFullDir = arg("zapFullDir", "zap_full");
const outPath = arg("out", "summary.html");

function readJSON(p) {
  return JSON.parse(fs.readFileSync(p, "utf-8"));
}
function listSarifFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".sarif"))
    .map((f) => path.join(dir, f));
}
function findFilesByNameRecursive(dir, filename) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  const stack = [dir];
  while (stack.length > 0) {
    const cur = stack.pop();
    let entries = [];
    try {
      entries = fs.readdirSync(cur, { withFileTypes: true });
    } catch {
      continue;
    }
    for (const ent of entries) {
      const p = path.join(cur, ent.name);
      if (ent.isDirectory()) {
        stack.push(p);
      } else if (ent.isFile() && ent.name === filename) {
        out.push(p);
      }
    }
  }
  return out.sort();
}
function levelToSeverity(level) {
  const lv = (level || "").toLowerCase();
  if (lv === "error") return "HIGH";
  if (lv === "warning") return "MEDIUM";
  if (lv === "note" || lv === "none") return "LOW";
  return "LOW";
}
function safe(s) {
  return String(s ?? "").replace(
    /[&<>]/g,
    (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c])
  );
}
function detectToolName(run) {
  const t = run?.tool?.driver?.name || "Unknown";
  if (/codeql/i.test(t)) return "CodeQL";
  if (/semgrep/i.test(t)) return "Semgrep";
  if (/trivy/i.test(t)) return "Trivy";
  if (/osv/i.test(t)) return "OSV";
  return t;
}
function collectFromSarif(sarifJson, label) {
  const runs = sarifJson.runs || [];
  const entries = [];
  for (const run of runs) {
    const tool = detectToolName(run);
    const results = run.results || [];
    const rulesArr = run.tool?.driver?.rules || [];
    const ruleMap = new Map(rulesArr.map((r) => [r.id, r]));
    for (const r of results) {
      const ruleId = r.ruleId || r.rule?.id || "unknown";
      const lvl = r.level || r.kind || "warning";
      const sev = levelToSeverity(lvl);
      const msg = r.message?.text || "";
      const uri =
        r.locations?.[0]?.physicalLocation?.artifactLocation?.uri || "";
      const rule = ruleMap.get(ruleId);
      entries.push({
        label,
        tool,
        severity: sev,
        level: lvl,
        ruleId,
        ruleName: rule?.name || ruleId,
        message: msg,
        uri,
      });
    }
  }
  return entries;
}
function collectToolNamesFromSarif(sarifJson) {
  const runs = sarifJson.runs || [];
  const names = [];
  for (const run of runs) names.push(detectToolName(run));
  return names;
}
function zapRiskToSeverity(riskcode) {
  const rc = String(riskcode ?? "");
  if (rc === "3") return "HIGH";
  if (rc === "2") return "MEDIUM";
  if (rc === "1") return "LOW";
  return "LOW";
}
function collectFromZapJson(jsonPath, toolLabel) {
  if (!fs.existsSync(jsonPath)) return [];
  let doc;
  try {
    doc = readJSON(jsonPath);
  } catch {
    return [];
  }
  const sites = Array.isArray(doc.site) ? doc.site : [];
  const rows = [];
  for (const site of sites) {
    const siteUrl = site["@name"] || "";
    const alerts = Array.isArray(site.alerts) ? site.alerts : [];
    for (const a of alerts) {
      const severity = zapRiskToSeverity(a.riskcode);
      const level =
        severity === "HIGH"
          ? "error"
          : severity === "MEDIUM"
          ? "warning"
          : "note";
      const ruleId = String(a.pluginid || a.alertRef || a.alert || "ZAP");
      const ruleName = String(a.alert || ruleId);
      const msg = String(a.desc || a.alert || "");
      const instances = Array.isArray(a.instances) ? a.instances : [];
      if (instances.length === 0) {
        rows.push({
          label: path.basename(jsonPath),
          tool: toolLabel,
          severity,
          level,
          ruleId,
          ruleName,
          message: msg,
          uri: siteUrl,
        });
        continue;
      }
      for (const inst of instances) {
        rows.push({
          label: path.basename(jsonPath),
          tool: toolLabel,
          severity,
          level,
          ruleId,
          ruleName,
          message: msg,
          uri: inst.uri || siteUrl || "",
        });
      }
    }
  }
  return rows;
}
function countBy(arr, key) {
  const m = new Map();
  for (const it of arr) m.set(it[key], (m.get(it[key]) || 0) + 1);
  return m;
}
function countByMulti(arr, keys) {
  const m = new Map();
  for (const it of arr) {
    const k = keys.map((k) => it[k]).join(" | ");
    m.set(k, (m.get(k) || 0) + 1);
  }
  return m;
}
function tableFromMap(map, headers, cls = "") {
  let html = `<table class="${cls}"><thead><tr>`;
  for (const h of headers) html += `<th>${safe(h)}</th>`;
  html += `</tr></thead><tbody>`;
  for (const [k, v] of map) html += `<tr><td>${safe(k)}</td><td>${v}</td></tr>`;
  html += `</tbody></table>`;
  return html;
}
function sevCounts(arr) {
  const order = ["HIGH", "MEDIUM", "LOW"];
  const m = new Map(order.map((s) => [s, 0]));
  for (const r of arr) m.set(r.severity, (m.get(r.severity) || 0) + 1);
  return m;
}
function topRules(arr, n = 15) {
  const m = countByMulti(arr, ["tool", "ruleId", "ruleName", "severity"]);
  const rows = [...m.entries()]
    .map(([k, c]) => {
      const [tool, ruleId, ruleName, severity] = k.split(" | ");
      return { tool, ruleId, ruleName, severity, count: c };
    })
    .sort((a, b) => b.count - a.count);
  return rows.slice(0, n);
}

// 수집
let rows = [];
const seenTools = new Set();
for (const f of listSarifFiles(inDir)) {
  try {
    const doc = readJSON(f);
    for (const t of collectToolNamesFromSarif(doc)) seenTools.add(t);
    rows = rows.concat(collectFromSarif(doc, path.basename(f)));
  } catch (e) {
    console.error("SARIF parse error:", f, e.message);
  }
}
if (fs.existsSync(combinedPath)) {
  try {
    const doc = readJSON(combinedPath);
    for (const t of collectToolNamesFromSarif(doc)) seenTools.add(t);
    rows = rows.concat(collectFromSarif(doc, path.basename(combinedPath)));
  } catch {}
}
const zapBaselineJsonFiles = findFilesByNameRecursive(
  zapBaselineDir,
  "report_json.json"
);
const zapFullJsonFiles = findFilesByNameRecursive(zapFullDir, "report_json.json");
const zapBaselineRows = zapBaselineJsonFiles.flatMap((p) =>
  collectFromZapJson(p, "ZAP Baseline")
);
const zapFullRows = zapFullJsonFiles.flatMap((p) => collectFromZapJson(p, "ZAP Full"));
rows = rows.concat(zapBaselineRows, zapFullRows);
if (zapBaselineJsonFiles.length > 0) seenTools.add("ZAP Baseline");
if (zapFullJsonFiles.length > 0) seenTools.add("ZAP Full");

// 집계
const order = ["HIGH", "MEDIUM", "LOW"];
const overallSev = sevCounts(rows);
const byTool = new Map();
for (const r of rows) {
  const list = byTool.get(r.tool) || [];
  list.push(r);
  byTool.set(r.tool, list);
}
for (const t of seenTools) if (!byTool.has(t)) byTool.set(t, []);

function shell(body) {
  return `<!doctype html><html><head><meta charset="utf-8">
<title>Birdieswap Security Report</title>
<style>
body{font-family:system-ui,Segoe UI,Arial,sans-serif;margin:24px;color:#1f2328}
h1{margin:0 0 8px} h2{margin-top:28px}
table{border-collapse:collapse;width:100%;margin:12px 0}
th,td{border:1px solid #d0d7de;padding:8px;vertical-align:top}
th{background:#f6f8fa;text-align:left}
code{font-family:ui-monospace,SFMono-Regular,Menlo,Consolas,monospace}
.pill{display:inline-block;padding:2px 8px;border-radius:999px;font-size:12px;margin-right:6px}
.sev-HIGH{background:#cf222e;color:#fff}
.sev-MEDIUM{background:#bf8700;color:#fff}
.sev-LOW{background:#1a7f37;color:#fff}
</style></head><body>${body}</body></html>`;
}

// HTML
let html = "";
html += `<h1>Birdieswap Security Report</h1>`;
html += `<p>Combined SARIF results</p>`;
html += `<h2>Security Summary</h2>`;
html += `<p>ZAP (Baseline/Full), CodeQL, Semgrep, Trivy, OSV의 결과를 통합 요약합니다.</p>`;

html += `<h2>Overall Severity</h2><p>`;
for (const s of order) {
  const v = overallSev.get(s) || 0;
  const cls =
    s === "HIGH" ? "sev-HIGH" : s === "MEDIUM" ? "sev-MEDIUM" : "sev-LOW";
  html += `<span class="pill ${cls}">${s}: ${v}</span>`;
}
html += `</p>`;

html += `<h2>By Tool</h2>`;
for (const [tool, list] of byTool) {
  const sev = sevCounts(list);
  html += `<h3>${safe(tool)}</h3><p>`;
  for (const s of order) {
    const v = sev.get(s) || 0;
    const cls =
      s === "HIGH" ? "sev-HIGH" : s === "MEDIUM" ? "sev-MEDIUM" : "sev-LOW";
    html += `<span class="pill ${cls}">${s}: ${v}</span>`;
  }
  html += `</p>`;
}

html += `<h2>Top Findings (by Rule)</h2>`;
const top = topRules(rows, 15);
html += `<table><thead><tr><th>Tool</th><th>Severity</th><th>Rule</th><th>Rule ID</th><th>Count</th></tr></thead><tbody>`;
for (const t of top) {
  const cls =
    t.severity === "HIGH"
      ? "sev-HIGH"
      : t.severity === "MEDIUM"
      ? "sev-MEDIUM"
      : "sev-LOW";
  html += `<tr><td>${safe(t.tool)}</td><td class="${cls}">${safe(
    t.severity
  )}</td><td>${safe(t.ruleName)}</td><td><code>${safe(
    t.ruleId
  )}</code></td><td>${t.count}</td></tr>`;
}
html += `</tbody></table>`;

html += `<h2>Sample Findings (top 50)</h2>`;
const sample = rows.slice(0, 50);
html += `<table><thead><tr><th>Tool</th><th>Severity</th><th>Rule</th><th>Message</th><th>File/URL</th></tr></thead><tbody>`;
for (const r of sample) {
  const cls =
    r.severity === "HIGH"
      ? "sev-HIGH"
      : r.severity === "MEDIUM"
      ? "sev-MEDIUM"
      : "sev-LOW";
  html += `<tr><td>${safe(r.tool)}</td><td class="${cls}">${safe(
    r.severity
  )}</td><td><code>${safe(r.ruleId)}</code> ${safe(r.ruleName)}</td><td>${safe(
    r.message
  ).slice(0, 300)}</td><td>${safe(r.uri)}</td></tr>`;
}
html += `</tbody></table>`;

const hasBaseline =
  findFilesByNameRecursive(zapBaselineDir, "report_html.html").length > 0;
const hasFull = findFilesByNameRecursive(zapFullDir, "report_html.html").length > 0;
html += `<h2>ZAP Reports</h2><ul>`;
if (hasBaseline)
  html += `<li>Baseline HTML/JSON은 해당 런 아티팩트에 포함 (findings: ${
    zapBaselineRows.length
  })</li>`;
if (hasFull)
  html += `<li>Full Scan HTML/JSON은 해당 런 아티팩트에 포함 (findings: ${
    zapFullRows.length
  })</li>`;
if (!hasBaseline && !hasFull) html += `<li>(다운로드된 ZAP 아티팩트 없음)</li>`;
html += `</ul>`;

fs.writeFileSync(outPath, shell(html), "utf-8");
console.log(`Wrote ${outPath}`);
