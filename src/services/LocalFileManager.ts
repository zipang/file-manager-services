import { FileManagerInterface } from "./FileManagerInterface";
import { ResourceInfo } from "./ResourceInfo";
import { join } from "node:path";
import { mkdir, readdir, rm, rmdir } from "node:fs/promises";

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

	async getTreeContent(): Promise<ResourceInfo[]> {
		return this.listDirectoryContent("/");
	}

	async getFileContent(path: string): Promise<string | Buffer> {
		const fullPath = join(this.rootDir, path);
		const file = Bun.file(fullPath);
		return file.text();
	}

	async updateTextFile(path: string, content: string): Promise<void> {
		const fullPath = join(this.rootDir, path);
		await Bun.write(fullPath, content);
	}

	async updateBinaryFile(path: string, content: Buffer): Promise<void> {
		const fullPath = join(this.rootDir, path);
		await Bun.write(fullPath, new Uint8Array(content));
	}

	async deleteFile(path: string): Promise<void> {
		const fullPath = join(this.rootDir, path);
		await rm(fullPath);
	}

	async listDirectoryContent(path: string): Promise<ResourceInfo[]> {
		const rootDir = this.rootDir;
		const fullPath = join(rootDir, path);
		const dirEntries = await readdir(fullPath, { withFileTypes: true });

		return dirEntries.map(
			(entry) =>
				new ResourceInfo(join(entry.parentPath, entry.name), {
					rootDir,
					type: entry.isDirectory() ? "dir" : "file",
				})
		);
	}

	async createDirectory(path: string): Promise<void> {
		const fullPath = join(this.rootDir, path);
		await mkdir(fullPath, { recursive: true });
	}

	async deleteDirectory(path: string): Promise<void> {
		const fullPath = join(this.rootDir, path);
		await rmdir(fullPath);
	}
}
