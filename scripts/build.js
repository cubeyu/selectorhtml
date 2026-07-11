const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..");
const dist = path.join(root, "dist");
const distAssets = path.join(dist, "assets");

const editorParts = [
  "core.js",
  "selection.js",
  "ui.js",
  "export.js",
  "prompt.js",
];

const editorPayloadParts = [
  ...editorParts.map((file, index) => ({
    output: `${String(index).padStart(2, "0")}-${file.replace(/\.js$/, ".txt")}`,
    source: path.join("src", file),
  })),
  { output: "05-sharingan.txt", source: path.join("src", "sharingan.js"), stripHeader: true },
  { output: "06-context.txt", source: path.join("src", "context.js") },
];

function read(file) {
  return fs.readFileSync(path.join(root, file), "utf8");
}

function ensureDir(dir) {
  fs.mkdirSync(dir, { recursive: true });
}

function copyFile(from, to) {
  ensureDir(path.dirname(to));
  fs.copyFileSync(from, to);
}

function copyDir(from, to, skip) {
  ensureDir(to);
  for (const entry of fs.readdirSync(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name);
    const target = path.join(to, entry.name);
    const rel = path.relative(root, source);
    if (skip && skip(rel)) continue;
    if (entry.isDirectory()) copyDir(source, target, skip);
    else if (entry.isFile()) copyFile(source, target);
  }
}

function stripSharinganHeader(source) {
  return source.replace(/^\s*\/\*\*[\s\S]*?\*\/\s*/, "");
}

function buildEditor() {
  const outputDir = path.join(distAssets, "editor");
  ensureDir(outputDir);
  for (const part of editorPayloadParts) {
    const source = part.stripHeader ? stripSharinganHeader(read(part.source)) : read(part.source);
    const output = source.trim() + "\n\n";
    if (output.includes("__SHARINGAN_MODULE__")) {
      throw new Error(`Unreplaced Sharingan marker in ${part.source}`);
    }
    fs.writeFileSync(path.join(outputDir, part.output), output);
  }
}

function build() {
  fs.rmSync(dist, { recursive: true, force: true });
  ensureDir(distAssets);
  copyFile(path.join(root, "index.html"), path.join(dist, "index.html"));
  copyFile(path.join(root, "assets", "editor.css"), path.join(distAssets, "editor.css"));
  copyFile(path.join(root, "assets", "favicon.svg"), path.join(distAssets, "favicon.svg"));
  copyDir(path.join(root, "assets", "product-hunt"), path.join(distAssets, "product-hunt"));
  buildEditor();
}

build();
