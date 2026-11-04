import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { tokens } from "../tailwind.config.mjs";

const packageJson = JSON.parse(await readFile(new URL("../package.json", import.meta.url), "utf8"));
const lock = JSON.parse(await readFile(new URL("../package-lock.json", import.meta.url), "utf8"));

const allDependencies = {
  ...packageJson.dependencies,
  ...packageJson.devDependencies,
};

for (const [name, version] of Object.entries(allDependencies)) {
  assert.match(version, /^\d+\.\d+\.\d+$/, `${name} must use an exact version`);
}

const bannedPackages = [
  "@aceternity/ui",
  "aceternity-ui",
  "framer-motion",
  "motion",
  // GSAP is allowed from 2026-11-03 (owner's decision): free for commercial sites under its Standard License.
  "lenis",
  "@shadcn/ui",
];
for (const name of bannedPackages) {
  assert.equal(allDependencies[name], undefined, `${name} is not allowed in Step 1`);
}

for (const [path, entry] of Object.entries(lock.packages)) {
  if (!path || !entry.resolved) continue;
  assert.ok(
    entry.resolved.startsWith("https://registry.npmjs.org/"),
    `${path} resolved outside the public npm registry: ${entry.resolved}`,
  );
}

assert.deepEqual(tokens.color, {
  inherit: "inherit",
  current: "currentColor",
  transparent: "transparent",
  paper: "#FFFFFF",
  ink: "#15181C",
  terracotta: "#BE4C33",
  bronze: "#A37139",
  ember: "#E8714A",
  gold: "#D4A35F",
  night: {
    950: "#07080A",
    900: "#0C0E11",
    800: "#13161B",
    700: "#1C2027",
    600: "#2A2F38",
  },
  stone: {
    50: "#F7F6F3",
    100: "#ECE9E3",
    400: "#A8A396",
    600: "#6B665A",
  },
});

assert.equal(tokens.fontFamily.display[0], '"Space Grotesk"');
assert.equal(tokens.fontFamily.sans[0], '"Public Sans"');
assert.equal(tokens.fontFamily.mono[0], '"IBM Plex Mono"');
assert.equal(Object.hasOwn(tokens.color, "indigo"), false, "default indigo is banned");
assert.equal(Object.hasOwn(tokens.radius, "card"), true);
assert.equal(Object.hasOwn(tokens.fontSize, "h1"), true);
assert.equal(Object.hasOwn(tokens.spacing, "12"), true);

console.log(`Foundation verified: ${Object.keys(allDependencies).length} exact dependencies, approved Akrithos tokens, public npm registry only.`);
