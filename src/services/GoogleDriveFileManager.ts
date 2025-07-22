import { type drive_v3, google } from "googleapis";
import type { OAuth2Client } from "google-auth-library";
import type { FileManagerInterface } from "./FileManagerInterface";
import { ResourceInfo } from "./ResourceInfo";
import { FileManagerError, FileNotFoundError } from "./FileManagerErrors";
import { normalizePath, splitPath } from "../utils";

export class GoogleDriveFileManager implements FileManagerInterface {
	private drive: drive_v3.Drive;
	private rootDir: string;

	private idsCache = new Map<string, string>(
		Object.entries({
			"/": "root"
		})
	);

	constructor(oauth2Client: OAuth2Client, rootDir = "/") {
		this.drive = google.drive({ version: "v3", auth: oauth2Client });
		this.rootDir = rootDir;
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

			return Buffer.from(response.data as ArrayBuffer);
		} catch (_error) {
			throw new FileManagerError(500, `Failed to retrieve content of the file at path: ${path}`);
		}
	}

	async updateTextFile(path: string, content: string): Promise<void> {
		const fileId = await this.getFileIdByPath(path);
		try {
			await this.drive.files.update({
				fileId,
				media: {
					body: content
				}
			});
		} catch (_error) {
			throw new FileManagerError(500, `Failed to update text file at path: ${path}`);
		}
	}

	async updateBinaryFile(path: string, content: Buffer): Promise<void> {
		const fileId = await this.getFileIdByPath(path);
		try {
			await this.drive.files.update({
				fileId,
				media: {
					body: content
				}
			});
		} catch (_error) {
			throw new FileManagerError(500, `Failed to update binary file at path: ${path}`);
		}
	}

	async deleteFile(path: string): Promise<void> {
		const fileId = await this.getFileIdByPath(path);
		try {
			await this.drive.files.delete({ fileId });
		} catch (_error) {
			throw new FileManagerError(500, `Failed to delete file at path: ${path}`);
		}
	}

	/**
	 * List the content of a Google Drive directory
	 * @param {string} path The path of the directory to scan
	 * @param {boolean} recursive Pass TRUE to scan all child directories. Default: FALSE
	 * @returns A promise that resolves to an array of FileInfo objects
	 */
	async listDirectoryContent(path: string, _recursive = false): Promise<ResourceInfo[]> {
		const folderId = await this.getFolderIdByPath(path);
		try {
			const files =
				(
					await this.drive.files.list({
						q: `'${folderId}' in parents and trashed = false`,
						fields: "files(id, name, mimeType, parents)"
					})
				).data.files || [];

			return files.map(
				(file: any) =>
					new ResourceInfo(file.name, {
						rootDir: this.rootDir,
						type: file.mimeType === "application/vnd.google-apps.folder" ? "dir" : "file"
					})
			);
		} catch (_error) {
			throw new FileManagerError(500, `Failed to list directory content at path: ${path}`);
		}
	}

	async createDirectory(path: string): Promise<void> {
		try {
			await this.getFolderIdByPath(path, true);
		} catch (_error) {
			throw new FileManagerError(500, `Failed to create directory at path: ${path}`);
		}
	}

	async deleteDirectory(path: string): Promise<void> {
		const folderId = await this.getFolderIdByPath(path);
		try {
			await this.drive.files.delete({ fileId: folderId });
		} catch (_error) {
			throw new FileManagerError(500, `Failed to delete directory at path: ${path}`);
		}
	}

	/**
	 * Append the root directory to the path
	 */
	private getPathFromRoot(path: string): string {
		return normalizePath(`${this.rootDir}/${path}`);
	}

	/**
	 * Get a folder's ID
	 * Optionally create the folder if it doesn't exist
	 * @param folderPath like "get/me/somewhere/"
	 * @param createIfNotExist Force the creation of the folder
	 */
	private async getFolderIdByPath(folderPath: string, createIfNotExist = false): Promise<string> {
		folderPath = this.getPathFromRoot(folderPath);

		const cachedId = this.idsCache.get(folderPath);

		if (cachedId) return cachedId;

		let folderId = "root";
		let resp;
		let files: drive_v3.Schema$File[];

		const folderNames = folderPath.split("/").filter(Boolean);

		for (const folderName of folderNames) {
			resp = await this.drive.files.list({
				q: `'${folderId}' in parents and name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`,
				fields: "files(id, name)"
			});
			files = resp.data.files || [];

			if (files.length > 0) {
				folderId = files[0].id || "";
			} else {
				// This directory doesn't exist
				if (createIfNotExist === false) {
					throw new FileNotFoundError(folderPath, `Folder '${folderPath}' does not exist`);
				}
				resp = await this.drive.files.create({
					requestBody: {
						name: folderName,
						mimeType: "application/vnd.google-apps.folder",
						parents: [folderId]
					},
					fields: "id"
				});
				folderId = resp.data.id || "";
			}
		}

		this.idsCache.set(folderPath, folderId);
		return folderId;
	}

	/**
	 * Get a file's ID
	 * @param filePath
	 */
	private async getFileIdByPath(filePath: string): Promise<string> {
		const normalizedPath = normalizePath(filePath, {
			addLeadingSlash: true,
			addTrailingSlash: false
		});

		if (this.idsCache.has(normalizedPath)) {
			return this.idsCache.get(normalizedPath) as string;
		}

		const [parentFolder, fileName] = splitPath(normalizedPath);

		// Get the parent folder's id then get the file id
		return this.getFolderIdByPath(parentFolder)
			.then((parentFolderId) =>
				this.drive.files.list({
					q: `'${parentFolderId}' in parents and name='${fileName}' and trashed = false`,
					fields: "files(id)"
				})
			)
			.then(({ data }) => {
				const files = data.files || [];
				if (files.length === 0) {
					throw new FileNotFoundError(normalizedPath, `File '${normalizedPath}' does not exist`);
				}
				// We found the file's id let's cache it
				const fileId = files[0].id || "";
				this.idsCache.set(normalizedPath, fileId);
				return fileId;
			});
	}
}
