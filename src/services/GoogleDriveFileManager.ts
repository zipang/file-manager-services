import { google } from "googleapis";
import { OAuth2Client } from "google-auth-library";
import { FileManagerInterface } from "./FileManagerInterface";
import { ResourceInfo } from "./ResourceInfo";
import { FileManagerError, FileNotFoundError } from "./FileManagerErrors";

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
				fields: "files(id, name, mimeType)"
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
		const fileId = await this.getFileIdByPath(path);
		try {
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
		const fileId = await this.getFileIdByPath(path);
		try {
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
		const fileId = await this.getFileIdByPath(path);
		try {
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
		const fileId = await this.getFileIdByPath(path);
		try {
			await this.drive.files.delete({ fileId });
		} catch (error) {
			throw new FileManagerError(500, `Failed to delete file at path: ${path}`);
		}
	}

	async listDirectoryContent(path: string): Promise<ResourceInfo[]> {
		const fileId = await this.getFolderIdByPath(path);
		try {
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
			await this.getFolderIdByPath(path, true);
		} catch (error) {
			throw new FileManagerError(500, `Failed to create directory at path: ${path}`);
		}
	}

	async deleteDirectory(path: string): Promise<void> {
		const folderId = await this.getFolderIdByPath(path);
		try {
			await this.drive.files.delete({ fileId: folderId });
		} catch (error) {
			throw new FileManagerError(500, `Failed to delete directory at path: ${path}`);
		}
	}

	/**
	 * Get a folder's ID
	 * Optionally create the folder if it doesn't exist
	 * @param folderPath
	 * @param createIfNotExist Force the creation of the folder
	 */
	private async getFolderIdByPath(
		folderPath: string,
		createIfNotExist: boolean = false
	): Promise<string> {
		let folderId = "root";
		let resp, files;

		const folderNames = folderPath.split("/").filter(Boolean);

		for (const folderName of folderNames) {
			resp = await this.drive.files.list({
				q: `'${folderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
				fields: "files(id, name)"
			});
			files = resp.data.files;

			if (files.length > 0) {
				folderId = files[0].id;
			} else {
				// This directory doesn't exist
				if (createIfNotExist === false) {
					throw new FileNotFoundError(folderPath, `Folder '${folderPath}' does not exist`);
				}
				resp = await this.drive.files.create({
					resource: {
						name: folderName,
						mimeType: "application/vnd.google-apps.folder",
						parents: [folderId]
					},
					fields: "id"
				});
				folderId = resp.data.id;
			}
		}

		return folderId;
	}

	/**
	 * Get a file's ID
	 * @param filePath
	 */
	private async getFileIdByPath(filePath: string) {
		const { parent, name } = new ResourceInfo(filePath, { rootDir: this.rootDir });

		// Get the parent folder's id then get the file id
		return this.getFolderIdByPath(parent)
			.then((folderId) =>
				this.drive.files.list({
					q: `'${folderId}' in parents and name='${name}' and trashed = false`,
					fields: "files(id)"
				})
			)
			.then((resp) => {
				const files = resp.data.files;
				if (files.length === 0) {
					throw new FileNotFoundError(filePath, `File '${filePath}' does not exist`);
				}
				return files[0].id;
			});
	}
}
