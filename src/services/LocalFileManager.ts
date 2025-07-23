import { mkdir, readdir, rm, rmdir } from "node:fs/promises";
import { join } from "node:path";
import type { FileManagerInterface } from "./FileManagerInterface";
import { ResourceInfo } from "./ResourceInfo";

export interface LocalFileManagerOptions {
	rootDir: string;
}

/**
 * A File Manager that uses the local file system
 */
export class LocalFileManager implements FileManagerInterface {
	private rootDir: string;

	constructor(options: LocalFileManagerOptions) {
		this.rootDir = options.rootDir || "/";
	}
	/**
	 * Get detailed info about the resource on this path
	 * @param path The path of the file or folder
	 */
	getInfo(path: string): ResourceInfo {
		return new ResourceInfo(path, { rootDir: this.rootDir });
	}

	/**
	 * Gets file content as text or binary buffer
	 * @param path Path to file relative to root directory
	 * @returns File contents as string or Buffer
	 */
	async getFileContent(path: string): Promise<string | Buffer> {
		const fullPath = join(this.rootDir, path);
		const file = Bun.file(fullPath);
		return file.text();
	}

	/**
	 * Updates a text file with new content
	 * @param path Path to file relative to root directory
	 * @param content New text content to write
	 */
	async updateTextFile(path: string, content: string): Promise<void> {
		const fullPath = join(this.rootDir, path);
		await Bun.write(fullPath, content);
	}

	/**
	 * Updates a binary file with new content
	 * @param path Path to file relative to root directory
	 * @param content New binary content to write
	 */
	async updateBinaryFile(path: string, content: Buffer): Promise<void> {
		const fullPath = join(this.rootDir, path);
		await Bun.write(fullPath, new Uint8Array(content));
	}

	/**
	 * Deletes a file
	 * @param path Path to file relative to root directory
	 */
	async deleteFile(path: string): Promise<void> {
		const fullPath = join(this.rootDir, path);
		await rm(fullPath);
	}

	/**
	 * Lists contents of a directory
	 * @param path Directory path relative to root directory
	 * @param recursive Whether to list contents recursively
	 * @returns Array of ResourceInfo objects describing directory contents
	 */
	async listDirectoryContent(path: string, recursive = false): Promise<ResourceInfo[]> {
		const rootDir = this.rootDir;
		const fullPath = join(rootDir, path);
		const dirEntries = await readdir(fullPath, {
			withFileTypes: true,
			recursive
		});

		return dirEntries.map(
			(entry) =>
				new ResourceInfo(join(entry.parentPath, entry.name), {
					rootDir,
					type: entry.isDirectory() ? "dir" : "file"
				})
		);
	}

	/**
	 * Creates a new directory (and parent directories if needed)
	 * @param path Directory path to create relative to root directory
	 */
	async createDirectory(path: string): Promise<void> {
		const fullPath = join(this.rootDir, path);
		await mkdir(fullPath, { recursive: true });
	}

	/**
	 * Deletes an empty directory
	 * @param path Directory path to delete relative to root directory
	 */
	async deleteDirectory(path: string): Promise<void> {
		const fullPath = join(this.rootDir, path);
		await rmdir(fullPath);
	}
}
