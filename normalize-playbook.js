const fs = require("fs");

const sourcePath = "IAM_Engineer_Interview_Master_Playbook(1).md";
const dataPath = "playbook-data.js";
const source = fs.readFileSync(sourcePath, "utf8").replace(/\r\n/g, "\n");
const lines = source.split("\n");
const normalized = [];

const contractionMap = [
  [/\bcan't\b/gi, "cannot"], [/\bdon't\b/gi, "do not"], [/\bdoesn't\b/gi, "does not"],
  [/\bisn't\b/gi, "is not"], [/\bwon't\b/gi, "will not"], [/\bweren't\b/gi, "were not"],
  [/\bwasn't\b/gi, "was not"], [/\baren't\b/gi, "are not"], [/\bthey're\b/gi, "they are"],
  [/\bthey've\b/gi, "they have"], [/\bthat's\b/gi, "that is"], [/\bit's\b/gi, "it is"],
  [/\byou're\b/gi, "you are"], [/\bwe're\b/gi, "we are"], [/\bwe've\b/gi, "we have"],
  [/\bi'm\b/gi, "I am"], [/\bi've\b/gi, "I have"], [/\bi'll\b/gi, "I will"],
  [/\byou'll\b/gi, "you will"], [/\byou've\b/gi, "you have"], [/\bwe'll\b/gi, "we will"],
  [/\bthey'll\b/gi, "they will"], [/\bhasn't\b/gi, "has not"], [/\bhaven't\b/gi, "have not"]
];

function normalizeProse(text) {
  let result = text;
  for (const [pattern, replacement] of contractionMap) result = result.replace(pattern, replacement);
  return result.replace(/\s+/g, " ").trim();
}

for (let index = 0; index < lines.length; index++) {
  const line = lines[index];
  const trimmed = line.trim();
  const structural = !trimmed || /^#{1,6}\s/.test(trimmed) || /^[-*]\s/.test(trimmed) || /^>\s/.test(trimmed) || /^```/.test(trimmed) || /^<[^>]+>/.test(trimmed) || /^---+$/.test(trimmed);

  if (structural) {
    normalized.push(trimmed);
    continue;
  }

  if (/^\d+[.)]\s/.test(trimmed)) {
    const match = trimmed.match(/^(\d+[.)]\s)(.*)$/);
    normalized.push(match[1] + normalizeProse(match[2]));
    continue;
  }

  let paragraph = normalizeProse(trimmed);
  while (index + 1 < lines.length) {
    const next = lines[index + 1].trim();
    if (!next || /^#{1,6}\s/.test(next) || /^\d+[.)]\s/.test(next) || /^[-*]\s/.test(next) || /^>\s/.test(next) || /^```/.test(next) || /^<[^>]+>/.test(next) || /^---+$/.test(next)) break;
    paragraph += " " + normalizeProse(next);
    index++;
  }
  normalized.push(paragraph);
}

const cleaned = normalized.join("\n").replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
fs.writeFileSync(sourcePath, cleaned);

const payload = Buffer.from(cleaned, "utf8").toString("base64").replace(/.{1,120}/g, "$&\n").replace(/\n$/, "");
const output = `// Auto-generated from IAM_Engineer_Interview_Master_Playbook(1).md\n// Embedded copy for offline browser use.\nwindow.PLAYBOOK_MARKDOWN = (function () {\n  var b64 = ${JSON.stringify(payload).replace(/\\n/g, "\\n")};\n  return decodeURIComponent(Array.prototype.map.call(atob(b64.replace(/\\s/g, "")), function (byte) {\n    return '%' + ('00' + byte.charCodeAt(0).toString(16)).slice(-2);\n  }).join(''));\n})();\n`;
fs.writeFileSync(dataPath, output);
console.log(`Normalized ${cleaned.split("\n").length} lines; preserved ${(cleaned.match(/^## \d+\./gm) || []).length} topics.`);
