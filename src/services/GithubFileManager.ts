import { Octokit } from "@octokit/core";
import { type Api, restEndpointMethods } from "@octokit/plugin-rest-endpoint-methods";
import type { FileManagerInterface } from "./FileManagerInterface";
import { FileManagerError, FileNotFoundError, FileUpdateError } from "./FileManagerErrors";
import { ResourceInfo } from "../utils/ResourceInfo";
import { normalizePath } from "../utils";

const OctokitWithRestApi = Octokit.plugin(restEndpointMethods);

type GithubFileInfo = {
	type: "file";
	encoding: string;
	size: number;
	path: string;
	content: string | null;
	sha: string | null;
};

export interface GithubFileManagerOptions {
	/**
	 * The URL of the Github repository to use for file storage.
	 */
	githubRepoUrl: string;
	/**
	 * The Github application token to use for authentication.
	 */
	githubApplicationToken: string;
	/**
	 * The root directory to use for file storage.
	 * If not provided, the repository's root directory will be used.
	 */
	rootDir?: string;
}

/**
 * This File Manager uses a Github repo as the backend service
 * for storing and retrieving files.
 */
export class GithubFileManager implements FileManagerInterface {
	private owner: string;
	private repo: string;
	private rootDir: string;
	private githubApplicationToken: string;
	private octokit: Octokit & Api;

	/**
	 * In the constructor we initialize an instance of Octokit
	 * that we will reuse through all methods to access the github repository
	 * whose URL is passed to the constructor
	 */
	constructor({ githubRepoUrl, githubApplicationToken, rootDir = "" }: GithubFileManagerOptions) {
		this.githubApplicationToken = githubApplicationToken;
		this.octokit = new OctokitWithRestApi({
			auth: this.githubApplicationToken,
			userAgent: "Github File Manager Service/v1.0.0"
		});
		const { owner, repo } = this.extractOwnerAndRepo(githubRepoUrl);
		this.owner = owner;
		this.repo = repo;
		// Remove leading and trailing slashes as well as multiple
		this.rootDir = normalizePath(rootDir);
	}

	/**
	 * Extract the repository's and owner's names from the github repo URL
	 */
	private extractOwnerAndRepo(githubUrl: string) {
		const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
		if (!match) {
			throw new FileManagerError(400, "Invalid GitHub repository URL", githubUrl);
		}
		const [, owner, repo] = match;
		return { owner, repo };
	}

	/**
	 * Add the root directory to the path
	 */
	private getPathFromRoot(path: string): string {
		return normalizePath(`${this.rootDir}/${path}`);
	}

	/**
	 * Catch the 404 error when a file does not exist
	 * and return instead a description with an empty content and sha
	 */
	private async getFileInfos(path: string): Promise<GithubFileInfo> {
		const fullPath = this.getPathFromRoot(path);
		return this.octokit.rest.repos
			.getContent({
				owner: this.owner,
				repo: this.repo,
				path: fullPath
			})
			.then(({ data }) => {
				if (Array.isArray(data) || data.type !== "file") {
					// This path does not point to a file ressource
					throw new FileNotFoundError(path, "Path is not a file");
				}
				return data;
			})
			.catch((err) => {
				if (err.status === 404) {
					return {
						path,
						content: null,
						encoding: "base64",
						type: "file",
						size: 0,
						sha: null
					};
				}
				throw err;
			});
	}

	/**
	 * Get detailed info about the resource on this path
	 * @param path The path of the file or folder
	 */
	getInfo(path: string): ResourceInfo {
		return new ResourceInfo(path, { rootDir: this.rootDir });
	}

	async getFileContent(path: string): Promise<string | Buffer> {
		const { content, encoding } = await this.getFileInfos(path);
		if (content === null) {
			throw new FileNotFoundError(path, "File does not exist");
		}

		if (encoding === "base64") {
			return Buffer.from(content, "base64");
		}
		return content;
	}

	/**
	 * Creates or updates a text file on the github repository
	 * @param path The path of the file
	 * @param content New text content of the file
	 * @param message Optionnal commit message
	 * @returns A promise that resolves to void on success, or rejects with an error
	 */
	async updateTextFile(filePath: string, content: string, _message?: string) {
		// Retrieve the infos of the file to update
		const { sha, path } = await this.getFileInfos(filePath);

		try {
			if (sha) {
				// File already exists, it's an update
				await this.octokit.rest.repos.createOrUpdateFileContents({
					owner: this.owner,
					repo: this.repo,
					path,
					message: `Updated ${path}`,
					content: Buffer.from(content, "utf-8").toString("base64"),
					sha
				});
			} else {
				await this.octokit.rest.repos.createOrUpdateFileContents({
					owner: this.owner,
					repo: this.repo,
					path,
					message: `Created ${path}`,
					content: Buffer.from(content, "utf-8").toString("base64")
				});
			}
		} catch (err) {
			throw new FileUpdateError(path, (err as Error).message);
		}
	}

	/**
	 * Creates or updates a binary file on the github repository
	 * @param filePath The path of the file
	 * @param content New binary content of the file
	 * @returns A promise that resolves to void on success, or rejects with an error
	 */
	async updateBinaryFile(filePath: string, content: Buffer): Promise<void> {
		// Retrieve the infos of the file to update
		const { sha, path } = await this.getFileInfos(filePath);

		try {
			if (sha) {
				// File already exists, it's an update
				await this.octokit.rest.repos.createOrUpdateFileContents({
					owner: this.owner,
					repo: this.repo,
					path,
					message: `Updated ${path}`,
					content: content.toString("base64"),
					sha
				});
			} else {
				await this.octokit.rest.repos.createOrUpdateFileContents({
					owner: this.owner,
					repo: this.repo,
					path,
					message: `Created ${path}`,
					content: content.toString("base64")
				});
			}
		} catch (err) {
			throw new FileUpdateError(path, (err as Error).message);
		}
	}

	async deleteFile(filePath: string) {
		// Retrieve the infos of the file to update
		const { sha, path } = await this.getFileInfos(filePath);

		if (sha === null) {
			// File does not exist.
			return;
		}

		try {
			await this.octokit.rest.repos.deleteFile({
				owner: this.owner,
				repo: this.repo,
				path,
				message: `Deleted '${path}'`,
				sha
			});
		} catch (err) {
			throw new FileUpdateError(filePath, (err as Error).message);
		}
	}

	/**
	 * Lists contents of a directory
	 * @param path Directory path relative to root directory
	 * @param recursive Whether to list contents recursively
	 * @returns Array of ResourceInfo objects describing directory contents
	 */
	async listDirectoryContent(dirPath: string, recursive = false) {
		const entries: ResourceInfo[] = [];
		const pendingSubDirs: Promise<ResourceInfo[]>[] = [];
		const rootDir = this.rootDir;

		// Get the directory content from the github repository
		const { data } = await this.octokit.rest.repos.getContent({
			owner: this.owner,
			repo: this.repo,
			path: this.getPathFromRoot(dirPath)
		});

		if (Array.isArray(data)) {
			// Extract entries type and path from the directory content
			for (const { type, path } of data) {
				if (type === "dir" || type === "file") {
					entries.push(new ResourceInfo(path, { type, rootDir }));

					// If recursive is true and this is a directory, collect the promise
					if (recursive && type === "dir") {
						pendingSubDirs.push(this.listDirectoryContent(path, true));
					}
				}
			}
		}

		// Wait for all subdirectories content to be retrieved in parallel
		const subEntries = await Promise.all(pendingSubDirs);
		return entries.concat(...subEntries);
	}

	async createDirectory(path: string): Promise<void> {
		const dirPath = this.getPathFromRoot(path);
		// The github API does not support creating directories,
		// so we create instead an empty `.gitkeep` file inside
		const dummyFilePath = `${dirPath}/.gitkeep`;

		return this.updateTextFile(dummyFilePath, "", `Created directory ${dirPath}`);
	}

	async deleteDirectory(dirPath: string): Promise<void> {
		const dirListing = await this.listDirectoryContent(dirPath);

		for (const entry of dirListing) {
			if (entry.isFile) {
				await this.deleteFile(entry.path);
			} else if (entry.isDirectory) {
				await this.deleteDirectory(entry.path);
			}
		}
	}
}
