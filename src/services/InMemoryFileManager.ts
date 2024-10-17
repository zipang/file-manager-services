import { FileNotFoundError } from "./FileManagerErrors";
import { FileManagerInterface } from "./FileManagerInterface";
import { ResourceInfo } from "./ResourceInfo";

/**
 * This file manager uses a Map to store the files in memory.
 * This is useful for testing and debugging.
 */
export class InMemoryFileManager implements FileManagerInterface {
	private fileSystem: Map<string, Buffer | string> = new Map();

	async getFileContent(path: string): Promise<string | Buffer> {
		const content = this.fileSystem.get(path);
		if (!content) {
			throw new FileNotFoundError(path, "File not found");
		}
		return content;
	}

	async getTreeContent() {
		const uniquePaths = new Set<ResourceInfo>();
		for (const rscPath of this.fileSystem.keys()) {
			// Remove the file name from the path
			uniquePaths.add(new ResourceInfo(rscPath.substring(0, rscPath.lastIndexOf("/"))));
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
				dirContent.push(new ResourceInfo(rscPath));
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
