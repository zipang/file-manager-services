import { FileNotFoundError } from "./FileManagerErrors";
import type { FileManagerInterface } from "./FileManagerInterface";
import { ResourceInfo } from "./ResourceInfo";

/**
 * This file manager uses a Map to store the files in memory.
 * This is useful for testing and debugging.
 */
export class InMemoryFileManager implements FileManagerInterface {
	private fileSystem: Map<string, Buffer | string> = new Map();

	getInfo(path: string): ResourceInfo {
		return new ResourceInfo(path);
	}

	async getFileContent(path: string): Promise<string | Buffer> {
		const content = this.fileSystem.get(path);
		if (!content) {
			throw new FileNotFoundError(path, "File not found");
		}
		return content;
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

	async listDirectoryContent(dirPath: string, recursive = false) {
		const fs = this.fileSystem;
		const dirContent: ResourceInfo[] = [];
		for (const rscPath of fs.keys()) {
			if (rscPath.startsWith(dirPath)) {
				if (recursive) {
					// Any path starting with the dirPath is a child of the directory
					dirContent.push(new ResourceInfo(rscPath));
				} else {
					// We don't want sub-directories and their content if recursive is false
					const relativePath = rscPath.substring(dirPath.length);
					if (!relativePath.includes("/")) {
						dirContent.push(new ResourceInfo(rscPath));
					}
				}
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
