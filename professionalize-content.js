const fs = require("fs");

const sourcePath = "IAM_Engineer_Interview_Master_Playbook(1).md";
const dataPath = "playbook-data.js";
let source = fs.readFileSync(sourcePath, "utf8");

const replacements = [
  [/leaveave-behind/g, "fallback"],
  [/the classic 2 a\.m\. outage/gi, "an avoidable certificate or configuration outage"],
  [/the 2 a\.m\. outage/gi, "an after-hours certificate or configuration outage"],
  [/at 2 a\.m\./gi, "after hours"],
  [/2 a\.m\./gi, "during an after-hours incident"],
  [/2 a\.m\. surprise/gi, "unexpected after-hours certificate outage"],
  [/keys to the kingdom/gi, "critical permissions for the workload"],
  [/the crown jewels/gi, "the highest-impact privileged accounts"],
  [/crown jewels/gi, "highest-impact privileged accounts"],
  [/Interviewers love this because/gi, "This is a valuable interview topic because"],
  [/the classic outage/gi, "a preventable outage"],
  [/that is how I implement/gi, "That is how I implement"],
  [/it is the bridge/gi, "It is the bridge"],
  [/it is a finite checklist/gi, "It is a finite checklist"],
  [/they are the plumbing/gi, "They are the plumbing"],
  [/it is the default/gi, "It is the default"],
  [/it means/g, "It means"],
  [/\. it is /g, ". It is "],
  [/\. that is /g, ". That is "],
  [/\. this is /g, ". This is "],
  [/\. they are /g, ". They are "],
  [/\. we /g, ". We "],
  [/\. i /g, ". I "],
  [/\bwhat the service actually proves\b/gi, "what the service has verified"]
];

for (const [pattern, replacement] of replacements) source = source.replace(pattern, replacement);
source = source.replace(/\u00a0/g, " ");
source = source.replace(/^[ \t]+/gm, "");
source = source.replace(/\n{3,}/g, "\n\n").trimEnd() + "\n";
fs.writeFileSync(sourcePath, source);

const payload = Buffer.from(source, "utf8").toString("base64").replace(/.{1,120}/g, "$&\n").replace(/\n$/, "");
const output = `// Auto-generated from IAM_Engineer_Interview_Master_Playbook(1).md\n// Embedded copy for offline browser use.\nwindow.PLAYBOOK_MARKDOWN = (function () {\n  var b64 = ${JSON.stringify(payload)};\n  return decodeURIComponent(Array.prototype.map.call(atob(b64.replace(/\\s/g, "")), function (byte) {\n    return '%' + ('00' + byte.charCodeAt(0).toString(16)).slice(-2);\n  }).join(''));\n})();\n`;
fs.writeFileSync(dataPath, output);
console.log(`Cleaned content and preserved ${(source.match(/^## \d+\./gm) || []).length} topics.`);
