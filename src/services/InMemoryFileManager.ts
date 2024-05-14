import { FileNotFoundError } from "./FileManagerErrors";
import { FileManagerInterface, ResourceInfo } from "./FileManagerInterface";

export class InMemoryResourceInfo implements ResourceInfo {
	constructor(
		public path: string,
		private fileSystem: Map<string, Buffer | string>
	) {}

	getName(): string {
		const parts = this.path.split("/");
		return this.isDirectory() ? parts[parts.length - 2] : parts[parts.length - 1];
	}

	isDirectory(): boolean {
		return this.path.endsWith("/");
	}

	isFile(): boolean {
		return !this.isDirectory() && this.fileSystem.has(this.path);
	}

	async getBinaryContent() {
		const data = this.fileSystem.get(this.path);
		if (data === undefined) {
			throw new FileNotFoundError(this.path, "Couldn't get binary content for file");
		}
		return typeof data === "string" ? Buffer.from(data, "utf-8") : data;
	}

	async getTextContent() {
		const data = this.fileSystem.get(this.path);
		if (data === undefined) {
			throw new FileNotFoundError(this.path, "Couldn't get text content for file");
		}
		return typeof data === "string" ? data : data.toString("utf-8");
	}

	async getSize() {
		if (this.isFile()) {
			const data = await this.getBinaryContent();
			return data.length;
		} else {
			return Promise.resolve(0);
		}
	}
}

/**
 * This file manager uses a Map to store the files in memory.
 * This is useful for testing and debugging.
 */
export class InMemoryFileManager implements FileManagerInterface {
	private fileSystem: Map<string, Buffer | string> = new Map();

	async getTreeContent() {
		const uniquePaths = new Set<string>();
		for (const rscPath of this.fileSystem.keys()) {
			// Remove the file name from the path
			uniquePaths.add(rscPath.substring(0, rscPath.lastIndexOf("/")));
		}
		return [...uniquePaths];
	}

	async updateTextFile(path: string, content: string) {
		this.fileSystem.set(path, content);
	}

	async updateBinaryFile(path: string, content: Buffer) {
		this.fileSystem.set(path, content);
	}

	async deleteFile(path: string): Promise<void> {
		const fileInfo = this.fileSystem.get(path);
		if (!fileInfo) {
			throw new FileNotFoundError(path, "Cannot delete file");
		}
		this.fileSystem.delete(path);
	}

	async listDirectoryContent(dirPath: string) {
		const fs = this.fileSystem;
		const dirContent: ResourceInfo[] = [];
		for (const rscPath of fs.keys()) {
			if (rscPath.startsWith(dirPath)) {
				dirContent.push(new InMemoryResourceInfo(rscPath, fs));
			}
		}
		return dirContent;
	}

	async createDirectory(dirPath: string) {
		// Ensure the path follows the convention for directories
		if (!dirPath.endsWith("/")) dirPath += "/";
		this.fileSystem.set(dirPath, "");
	}

	async deleteDirectory(dirPath: string) {
		const fs = this.fileSystem;
		for (const rscPath of fs.keys()) {
			if (rscPath.startsWith(dirPath)) {
				fs.delete(rscPath);
			}
		}
	}
}
