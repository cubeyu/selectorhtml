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
  const beforeSharingan = editorParts.map((file) => read(path.join("src", file)).trimEnd()).join("\n\n");
  const sharingan = stripSharinganHeader(read(path.join("src", "sharingan.js"))).trimEnd();
  const afterSharingan = read(path.join("src", "context.js")).trimStart();
  const output = `${beforeSharingan}\n\n${sharingan}\n\n${afterSharingan}`;
  if (output.includes("__SHARINGAN_MODULE__")) {
    throw new Error("Unreplaced Sharingan marker in built editor");
  }
  // GitHub Pages can refuse to serve generated JavaScript payloads even when
  // they are present in the deployment artifact. The installer only needs the
  // source as text, so publish it with a neutral extension and execute it from
  // the user-initiated javascript: bookmarklet.
  fs.writeFileSync(path.join(distAssets, "editor.txt"), output);
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
