import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { FileManagerInterface } from "./FileManagerInterface";
import { ResourceInfo } from "./ResourceInfo";
import { FileManagerError } from "./FileManagerErrors";

export class GoogleDriveFileManager implements FileManagerInterface {
	private drive: any;
	private rootDir: string;

	constructor(oauth2Client: OAuth2Client, rootDir: string = "root") {
		this.drive = google.drive({ version: "v3", auth: oauth2Client });
		this.rootDir = rootDir;
	}

	async getTreeContent(): Promise<ResourceInfo[]> {
		try {
			const response = await this.drive.files.list({
				q: `'${this.rootDir}' in parents and trashed = false`,
				fields: "files(id, name, mimeType, parents)"
			});
			return response.data.files.map(
				(file: any) =>
					new ResourceInfo(file.name, {
						rootDir: this.rootDir,
						type: file.mimeType === "application/vnd.google-apps.folder" ? "dir" : "file"
					})
			);
		} catch (error) {
			throw new FileManagerError(500, "Failed to retrieve directory paths");
		}
	}

	async getFileContent(path: string): Promise<string | Buffer> {
		try {
			const fileId = await this.getFileIdByPath(path);
			const response = await this.drive.files.get(
				{
					fileId,
					alt: "media"
				},
				{ responseType: "arraybuffer" }
			);

			return response.data;
		} catch (error) {
			throw new FileManagerError(500, `Failed to retrieve content of the file at path: ${path}`);
		}
	}

	async updateTextFile(path: string, content: string): Promise<void> {
		try {
			const fileId = await this.getFileIdByPath(path, true);
			await this.drive.files.update({
				fileId,
				media: {
					mimeType: "text/plain",
					body: content
				}
			});
		} catch (error) {
			throw new FileManagerError(500, `Failed to update text file at path: ${path}`);
		}
	}

	async updateBinaryFile(path: string, content: Buffer): Promise<void> {
		try {
			const fileId = await this.getFileIdByPath(path, true);
			await this.drive.files.update({
				fileId,
				media: {
					mimeType: "application/octet-stream",
					body: content
				}
			});
		} catch (error) {
			throw new FileManagerError(500, `Failed to update binary file at path: ${path}`);
		}
	}

	async deleteFile(path: string): Promise<void> {
		try {
			const fileId = await this.getFileIdByPath(path);
			await this.drive.files.delete({ fileId });
		} catch (error) {
			throw new FileManagerError(500, `Failed to delete file at path: ${path}`);
		}
	}

	async listDirectoryContent(path: string): Promise<ResourceInfo[]> {
		try {
			const fileId = await this.getFileIdByPath(path);
			const response = await this.drive.files.list({
				q: `'${fileId}' in parents and trashed = false`,
				fields: "files(id, name, mimeType, parents)"
			});
			return response.data.files.map(
				(file: any) =>
					new ResourceInfo(file.name, {
						rootDir: this.rootDir,
						type: file.mimeType === "application/vnd.google-apps.folder" ? "dir" : "file"
					})
			);
		} catch (error) {
			throw new FileManagerError(500, `Failed to list directory content at path: ${path}`);
		}
	}

	async createDirectory(path: string): Promise<void> {
		try {
			const parentDir = path.substring(0, path.lastIndexOf("/"));
			const parentFileId = await this.getFileIdByPath(parentDir);

			await this.drive.files.create({
				resource: {
					name: path.split("/").pop(),
					mimeType: "application/vnd.google-apps.folder",
					parents: [parentFileId]
				}
			});
		} catch (error) {
			throw new FileManagerError(500, `Failed to create directory at path: ${path}`);
		}
	}

	async deleteDirectory(path: string): Promise<void> {
		try {
			const fileId = await this.getFileIdByPath(path);
			await this.drive.files.delete({ fileId });
		} catch (error) {
			throw new FileManagerError(500, `Failed to delete directory at path: ${path}`);
		}
	}

	private async getFileIdByPath(path: string, createIfNotExist: boolean = false): Promise<string> {
		// Implementation to find file ID by path
		// Optionally create the file if it doesn't exist and createIfNotExist is true
		// This is a helper function and needs proper implementation
		return "";
	}
}
