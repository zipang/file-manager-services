import { describe, beforeEach, afterEach, it, expect, afterAll } from "bun:test";
import { FileManagerInterface } from "./FileManagerInterface";
import { InMemoryFileManager } from "./InMemoryFileManager";

describe("FileManager", () => {
	let fileManager: FileManagerInterface;

	// Initialize the file manager instance
	beforeEach(() => {
		fileManager = new InMemoryFileManager();
	});

	it("should create a text file", async () => {
		await fileManager.createTextFile("/test.txt", "Hello, World!");
		const entries = await fileManager.listDirectoryContent("/");
		expect(entries).toHaveLength(1);
		expect(entries[0].path).toBe("/test.txt");
		expect(entries[0].isFile()).toBe(true);
		expect((await entries[0].getTextContent()).toString()).toBe("Hello, World!");
	});

	it("should update a text file", async () => {
		await fileManager.createTextFile("/test.txt", "Hello, World!");
		await fileManager.updateTextFile("/test.txt", "Updated content");
		const entries = await fileManager.listDirectoryContent("/");
		expect(entries).toHaveLength(1);
		expect(entries[0].path).toBe("/test.txt");
		expect(entries[0].isFile()).toBe(true);
		expect((await entries[0].getTextContent()).toString()).toBe("Updated content");
	});

	it("should create a binary file", async () => {
		const buffer = Buffer.from("Hello, World!");
		await fileManager.createBinaryFile("/test.bin", buffer);
		const entries = await fileManager.listDirectoryContent("/");
		expect(entries).toHaveLength(1);
		expect(entries[0].path).toBe("/test.bin");
		expect(entries[0].isFile()).toBe(true);
		expect(await entries[0].getBinaryContent()).toEqual(buffer);
	});

	it("should update a binary file", async () => {
		const buffer = Buffer.from("Hello, World!");
		await fileManager.createBinaryFile("/test.bin", buffer);
		const updatedBuffer = Buffer.from("Updated content");
		await fileManager.updateBinaryFile("/test.bin", updatedBuffer);
		const entries = await fileManager.listDirectoryContent("/");
		expect(entries).toHaveLength(1);
		expect(entries[0].path).toBe("/test.bin");
		expect(entries[0].isFile()).toBe(true);
		expect(await entries[0].getBinaryContent()).toEqual(updatedBuffer);
	});

	it("should delete a file", async () => {
		await fileManager.createTextFile("/test.txt", "Hello, World!");
		const entries = await fileManager.listDirectoryContent("/");
		expect(entries).toHaveLength(1);
		await fileManager.deleteFile("/test.txt");
		const updatedFiles = await fileManager.listDirectoryContent("/");
		expect(updatedFiles).toHaveLength(0);
	});

	it("should create a directory", async () => {
		await fileManager.createDirectory("/test");
		const entries = await fileManager.listDirectoryContent("/");
		expect(entries).toHaveLength(1);
		expect(entries[0].path).toBe("/test/"); // all directories' path end with a trailing slash
		expect(entries[0].isFile()).toBe(false);
	});

	it("should delete a directory", async () => {
		await fileManager.createDirectory("/test");
		await fileManager.createTextFile("/test/file.txt", "Hello, World!");
		const entries = await fileManager.listDirectoryContent("/");
		expect(entries).toHaveLength(2);
		await fileManager.deleteDirectory("/test");
		const updatedFiles = await fileManager.listDirectoryContent("/");
		expect(updatedFiles).toHaveLength(0);
	});
});
