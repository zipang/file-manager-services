import { describe, beforeEach, it, expect, afterAll } from "bun:test";
import { FileManagerInterface, FileManagerFactory } from "./FileManagerInterface";
import { InMemoryFileManager } from "./InMemoryFileManager";
import { GithubFileManager } from "./GithubFileManager";

const allFileManagers: [
	fileManagerName: string,
	fileManagerFactory: FileManagerFactory,
	cleanup?: () => Promise<void>
][] = [
	["InMemoryFileManager", () => new InMemoryFileManager()],
	[
		"GithubFileManager",
		() =>
			new GithubFileManager({
				githubRepoUrl: process.env.GITHUB_TEST_REPO_URL || "GITHUB_TEST_REPO_URL",
				githubApplicationToken: process.env.GITHUB_TEST_APP_TOKEN || "GITHUB_TEST_APP_TOKEN",
				rootDir: "/tests/"
			}),
		() =>
			new GithubFileManager({
				githubRepoUrl: process.env.GITHUB_TEST_REPO_URL || "GITHUB_TEST_REPO_URL",
				githubApplicationToken: process.env.GITHUB_TEST_APP_TOKEN || "GITHUB_TEST_APP_TOKEN"
			}).deleteDirectory("/tests/")
	]
];

const buildTestSuite =
	(
		fileManagerName: string,
		fileManagerFactory: FileManagerFactory,
		cleanup?: () => Promise<void>
	) =>
	() => {
		/**
		 * Test suite
		 */
		describe(`FileManager (${fileManagerName})`, () => {
			let fileManager: FileManagerInterface;

			// Initialize a new file manager instance
			beforeEach(() => {
				fileManager = fileManagerFactory();
			});

			afterAll(async () => {
				if (cleanup) {
					await cleanup();
				}
			});

			it("updateTextFile() can create a new text file", async () => {
				await fileManager.updateTextFile("/test.txt", "Hello, World!");
				const entries = await fileManager.listDirectoryContent("/");
				const foundTestFile = entries.find((entry) => entry.path === "/test.txt");
				expect(foundTestFile).toBeDefined();
				expect(foundTestFile?.isFile()).toBe(true);
				expect(await foundTestFile?.getTextContent()).toBe("Hello, World!");
			});

			it("updateTextFile() can update an existing text file", async () => {
				await fileManager.updateTextFile("/test2.txt", "Another new file created!");
				await fileManager.updateTextFile("/test2.txt", "Now with updated content");
				const entries = await fileManager.listDirectoryContent("/");
				const foundTestFile = entries.find((entry) => entry.path === "/test2.txt");
				expect(foundTestFile).toBeDefined();
				expect(foundTestFile?.isFile()).toBe(true);
				expect(await foundTestFile?.getTextContent()).toBe("Now with updated content");
			});

			it("updateBinaryFile() can create a new binary file", async () => {
				const buffer = Buffer.from("Hello, World!");
				await fileManager.updateBinaryFile("/test.bin", buffer);
				const entries = await fileManager.listDirectoryContent("/");
				expect(entries).toHaveLength(1);
				expect(entries[0].path).toBe("/test.bin");
				expect(entries[0].isFile()).toBe(true);
				expect(await entries[0].getBinaryContent()).toEqual(buffer);
			});

			it("updateBinaryFile() can update an existing binary file", async () => {
				const buffer = Buffer.from("Hello, World!");
				await fileManager.updateBinaryFile("/test.bin", buffer);
				const updatedBuffer = Buffer.from("Updated content");
				await fileManager.updateBinaryFile("/test.bin", updatedBuffer);
				const entries = await fileManager.listDirectoryContent("/");
				expect(entries).toHaveLength(1);
				expect(entries[0].path).toBe("/test.bin");
				expect(entries[0].isFile()).toBe(true);
				expect(await entries[0].getBinaryContent()).toEqual(updatedBuffer);
			});

			it("deleteFile() can delete a file", async () => {
				await fileManager.updateTextFile("/test.txt", "Hello, World!");
				const entries = await fileManager.listDirectoryContent("/");
				expect(entries).toHaveLength(1);
				await fileManager.deleteFile("/test.txt");
				const updatedFiles = await fileManager.listDirectoryContent("/");
				expect(updatedFiles).toHaveLength(0);
			});

			it("createDirectory(() can create a directory", async () => {
				await fileManager.createDirectory("/tests/newDir/");
				const entries = await fileManager.listDirectoryContent("/tests/");
				expect(entries).toHaveLength(1);
				expect(entries[0].path).toBe("/tests/newDir/"); // all directories' path end with a trailing slash
				expect(entries[0].isFile()).toBe(false);
			});

			it("deleteDirectory(() can delete a directory", async () => {
				await fileManager.deleteDirectory("/tests/newDir/");
				const entries = await fileManager.listDirectoryContent("/tests/");
				expect(entries).toHaveLength(0);
			});
		});
	};

// Execute the test suite for each file manager
allFileManagers.forEach((testParameters) => {
	buildTestSuite(...testParameters)();
});
