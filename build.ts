// Build script for file-manager-services
// Services are built with bun target (server-side only)
// Utils are built with browser target (can be used on client-side too)

console.log("Starting build process...");

// Build services with bun target
const buildServices = await Bun.build({
	entrypoints: ["./src/services/index.ts"],
	outdir: "./dist/services",
	target: "bun",
	format: "esm",
	sourcemap: "external",
	minify: true,
	splitting: true,
	external: ["@octokit/core", "@octokit/plugin-rest-endpoint-methods", "googleapis"]
});

if (!buildServices.success) {
	console.error("Services build failed:", buildServices.logs);
	process.exit(1);
}

console.log("Services build completed successfully!");

// Build utils with browser target
const buildUtils = await Bun.build({
	entrypoints: ["./src/utils/index.ts"],
	outdir: "./dist/utils",
	target: "browser",
	format: "esm",
	sourcemap: "external",
	minify: true,
	splitting: true
});

if (!buildUtils.success) {
	console.error("Utils build failed:", buildUtils.logs);
	process.exit(1);
}

console.log("Utils build completed successfully!");
console.log("Build process completed!");
