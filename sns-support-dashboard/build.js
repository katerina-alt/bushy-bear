/* Builds a single, fully self-contained dist/index.html:
   esbuild bundles React + Recharts + the app, Tailwind compiles the CSS,
   and both are inlined into src/template.html. No runtime network requests. */
const { execFileSync } = require("child_process");
const esbuild = require("esbuild");
const fs = require("fs");
const path = require("path");

const p = (...a) => path.join(__dirname, ...a);

(async () => {
  const js = await esbuild.build({
    entryPoints: [p("src/main.jsx")],
    bundle: true,
    minify: true,
    write: false,
    format: "iife",
    loader: { ".jsx": "jsx", ".js": "jsx" },
    jsx: "automatic",
    target: ["es2018"],
    define: { "process.env.NODE_ENV": '"production"' },
    logLevel: "warning",
  });

  fs.mkdirSync(p("build"), { recursive: true });
  execFileSync(
    process.execPath,
    [p("node_modules/tailwindcss/lib/cli.js"), "-c", p("tailwind.config.js"), "-i", p("src/input.css"), "-o", p("build/app.css"), "--minify"],
    { stdio: "inherit" }
  );

  const html = fs
    .readFileSync(p("src/template.html"), "utf8")
    .replace("/*__CSS__*/", () => fs.readFileSync(p("build/app.css"), "utf8"))
    .replace("/*__JS__*/", () => js.outputFiles[0].text);

  fs.mkdirSync(p("dist"), { recursive: true });
  fs.writeFileSync(p("dist/index.html"), html);

  // Artifact-hosting copy: the host supplies <!doctype>/<html>/<head>/<body>,
  // so keep only the title, meta, style and page content.
  const artifact = html
    .replace(/<!doctype html>\s*<html[^>]*>\s*<head>\s*/i, "")
    .replace(/<meta charset[^>]*>\s*<meta name="viewport"[^>]*>\s*/i, "")
    .replace(/<\/head>\s*<body>\s*/i, "")
    .replace(/\s*<\/body>\s*<\/html>\s*$/i, "\n");
  fs.writeFileSync(p("dist/artifact.html"), artifact);
  console.log(`Built dist/index.html (${(Buffer.byteLength(html) / 1024).toFixed(0)} KB, self-contained)`);
})().catch((e) => {
  console.error(e);
  process.exit(1);
});
