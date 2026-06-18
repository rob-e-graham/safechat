// Build a self-contained app/inspector.html by inlining src/browser.js into
// the template. The result has zero external dependencies — it runs by
// double-clicking the file (file://), from any server root, and offline.
//
// Regenerate after changing src/browser.js or the template:
//   node scripts/build-inspector.js

const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const templatePath = path.join(root, "scripts", "inspector.template.html");
const enginePath = path.join(root, "src", "browser.js");
const outPath = path.join(root, "app", "inspector.html");

const template = fs.readFileSync(templatePath, "utf8");

// Escape any literal </script so the inlined engine can't close the host
// <script> tag early. "<\/script" is identical to "</script" in JS source.
const engine = fs.readFileSync(enginePath, "utf8").replace(/<\/script/gi, "<\\/script");

const marker = '<script src="../src/browser.js"></script>';
if (!template.includes(marker)) {
  throw new Error("build-inspector: marker <script src=\"../src/browser.js\"> not found in template");
}

const inlined =
  "<!-- SafeChat engine inlined from src/browser.js — regenerate: node scripts/build-inspector.js -->\n" +
  "<script>\n" + engine + "\n</script>";

const out = template.replace(marker, inlined);
fs.writeFileSync(outPath, out, "utf8");

console.log("Built self-contained app/inspector.html (" + Math.round(out.length / 1024) + " KB) — runs with no server.");
