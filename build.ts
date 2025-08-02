// Tree-shakeable build script for file-manager-services
// Each service is built separately for optimal tree-shaking
// Services are built with bun target (server-side only)
// Utils are built with browser target (can be used on client-side too)

import { lstatSync } from "fs";

console.log("Starting tree-shakeable build process...\n");

// Service files to build individually
const serviceFiles = [
	"FileManagerFactory",
	"FileManagerInterface", 
	"GithubFileManager",
	"GoogleDriveAuth",
	"GoogleDriveFileManager",
	"InMemoryFileManager",
	"LocalFileManager"
];

// Utility files to build
const utilFiles = [
	"path-utils",
	"ResourceInfo"
];

// Track build results for reporting
const buildResults: { name: string; size: number }[] = [];

// Function to get file size in KB
function getFileSizeKB(filePath: string): number {
	try {
		const stats = lstatSync(filePath);
		return Math.round((stats.size / 1024) * 100) / 100; // Round to 2 decimal places
	} catch {
		return 0;
	}
}

// Build each service file individually
console.log("Building individual service bundles...\n");

for (const serviceFile of serviceFiles) {
	const buildResult = await Bun.build({
		entrypoints: [`./src/services/${serviceFile}.ts`],
		outdir: "./dist/services",
		target: "bun",
		format: "esm",
		sourcemap: "external",
		minify: true,
		external: ["@octokit/core", "@octokit/plugin-rest-endpoint-methods", "googleapis"]
	});

	if (!buildResult.success) {
		console.error(`Build failed for ${serviceFile}:`, buildResult.logs);
		process.exit(1);
	}

	// Record build result
	const outputPath = `./dist/services/${serviceFile}.js`;
	const size = getFileSizeKB(outputPath);
	buildResults.push({ name: `services/${serviceFile}.js`, size });

	console.log(`✓ Built ${serviceFile}.js (${size} KB)`);
}

// Build utils individually
console.log("\nBuilding individual utility bundles...\n");

for (const utilFile of utilFiles) {
	const buildResult = await Bun.build({
		entrypoints: [`./src/utils/${utilFile}.ts`],
		outdir: "./dist/utils",
		target: "browser",
		format: "esm",
		sourcemap: "external",
		minify: true
	});

	if (!buildResult.success) {
		console.error(`Build failed for ${utilFile}:`, buildResult.logs);
		process.exit(1);
	}

	// Record build result
	const outputPath = `./dist/utils/${utilFile}.js`;
	const size = getFileSizeKB(outputPath);
	buildResults.push({ name: `utils/${utilFile}.js`, size });

	console.log(`✓ Built ${utilFile}.js (${size} KB)`);
}

// Build main service index (re-exporting all services)
console.log("\nBuilding service index...\n");

const serviceIndexBuild = await Bun.build({
	entrypoints: ["./src/services/index.ts"],
	outdir: "./dist/services",
	target: "bun",
	format: "esm",
	sourcemap: "external",
	minify: true,
	external: ["@octokit/core", "@octokit/plugin-rest-endpoint-methods", "googleapis"]
});

if (!serviceIndexBuild.success) {
  console.error("Service index build failed:", serviceIndexBuild.logs);
  process.exit(1);
}

const serviceIndexPath = "./dist/services/index.js";
const serviceIndexSize = getFileSizeKB(serviceIndexPath);
buildResults.push({ name: "services/index.js", size: serviceIndexSize });
console.log(`✓ Built services/index.js (${serviceIndexSize} KB)`);

// Build main utils index (re-exporting all utils)
console.log("\nBuilding utils index...\n");

const utilsIndexBuild = await Bun.build({
	entrypoints: ["./src/utils/index.ts"],
	outdir: "./dist/utils",
	target: "browser",
	format: "esm",
	sourcemap: "external",
	minify: true
});

if (!utilsIndexBuild.success) {
  console.error("Utils index build failed:", utilsIndexBuild.logs);
  process.exit(1);
}

const utilsIndexPath = "./dist/utils/index.js";
const utilsIndexSize = getFileSizeKB(utilsIndexPath);
buildResults.push({ name: "utils/index.js", size: utilsIndexSize });
console.log(`✓ Built utils/index.js (${utilsIndexSize} KB)`);

// Build main package index
console.log("\nBuilding main package index...\n");

const mainIndexBuild = await Bun.build({
	entrypoints: ["./src/index.ts"],
	outdir: "./dist",
	target: "bun",
	format: "esm",
	sourcemap: "external",
	minify: true,
	external: ["@octokit/core", "@octokit/plugin-rest-endpoint-methods", "googleapis"]
});

if (!mainIndexBuild.success) {
	console.error("Main index build failed:", mainIndexBuild.logs);
	process.exit(1);
}

const mainIndexPath = "./dist/index.js";
const mainIndexSize = getFileSizeKB(mainIndexPath);
buildResults.push({ name: "index.js", size: mainIndexSize });
console.log(`✓ Built index.js (${mainIndexSize} KB)`);

// Display size report
console.log("\nBuild Results:");
console.log("┌─────────────────────────────────────┬─────────────┐");
console.log("│ Bundle                              │ Size        │");
console.log("├─────────────────────────────────────┼─────────────┤");

let totalSize = 0;
for (const result of buildResults) {
	totalSize += result.size;
	console.log(`│ ${result.name.padEnd(35)} │ ${result.size.toString().padStart(8)} KB │`);
}

console.log("├─────────────────────────────────────┼─────────────┤");
console.log(`│ Total                               │ ${totalSize.toString().padStart(8)} KB │`);
console.log("└─────────────────────────────────────┴─────────────┘");

console.log("\n✅ Tree-shakeable build completed successfully!\n");
console.log("Individual services can now be imported separately:");
console.log("import { LocalFileManager } from 'file-manager-services/services/LocalFileManager'");
