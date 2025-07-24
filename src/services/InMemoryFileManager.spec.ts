import { describe, it } from "bun:test";
import { testSuite } from "./FileManager.spec";
import { InMemoryFileManager } from "./InMemoryFileManager";

function createFileManager() {
	return new InMemoryFileManager();
}

async function cleanup() {}

describe("InMemoryFileManager", async () => {
	it("Should pass the common test suite", async () => {
		await testSuite("InMemoryFileManager", createFileManager, cleanup)();
	});
});
