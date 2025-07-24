import { describe, it } from "bun:test";
import { mkdir, rm } from "node:fs/promises";
import { join } from "node:path";
import { testSuite } from "./FileManager.spec";
import { LocalFileManager } from "./LocalFileManager";

const rootDir = join(import.meta.dirname, "../../_testsRoot");

function createFileManager() {
	console.log(`Creating the root dir for tests inside '${rootDir}'`);
	mkdir(rootDir, { recursive: true });
	return new LocalFileManager({ rootDir });
}

async function cleanup() {
	rm(rootDir, { recursive: true, force: true });
}

describe("LocalFileManager", async () => {
	it("Should pass the common test suite", async () => {
		await testSuite("LocalFileManager", createFileManager, cleanup)();
	});
});
