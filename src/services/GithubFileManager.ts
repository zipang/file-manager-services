import { Octokit } from "@octokit/core";
import { composeCreateOrUpdateTextFile } from "@octokit/plugin-create-or-update-text-file";
import { Api, restEndpointMethods } from "@octokit/plugin-rest-endpoint-methods";
import { FileManagerInterface, ResourceInfo } from "./FileManagerInterface";
import { FileNotFoundError, FileUpdateError } from "./FileManagerErrors";

const OctokitWithRestApi = Octokit.plugin(restEndpointMethods);

interface GithubFileManagerOptions {
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
 * Add the root dir and sanitize everything
 * Note: the final path must _not_ start with a slash
 */
const sanitizePath = (path: string, rootDir: string) => {
	return (rootDir + "/" + path).split("/").filter(Boolean).join("/");
};

/**
 * Add the root dir and sanitize everything
 * Note: the final path must _not_ start with a slash
 */
const removeRootDir = (path: string, rootDir: string) => {
	if (rootDir.startsWith("/")) {
		rootDir = rootDir.substring(1);
	}
	console.log(`Remove '${rootDir}' from '${path}'`);
	return "/" + path.substring(rootDir.length);
};

export class GithubFileInfo implements ResourceInfo {
	constructor(
		public path: string,
		private size: number,
		private content: string = ""
	) {}

	isDirectory() {
		return false;
	}

	isFile() {
		return true;
	}

	/**
	 * @returns the name of the file.
	 */
	getName() {
		return this.path.split("/").pop() || "";
	}

	async getSize() {
		return this.size;
	}

	async getTextContent() {
		return this.content;
	}

	async getBinaryContent() {
		return Buffer.from(this.content || "");
	}

	toString() {
		return this.path;
	}
}

export class GithubDirInfo implements ResourceInfo {
	constructor(
		public path: string,
		private size: number
	) {}

	isDirectory() {
		return true;
	}

	isFile() {
		return false;
	}

	/**
	 * @returns the name of the directory.
	 */
	getName() {
		return this.path.split("/").pop() || "";
	}

	async getSize() {
		return this.size;
	}

	async getTextContent() {
		throw new FileNotFoundError(this.path, "Cannot get text content for directory");
	}

	async getBinaryContent() {
		throw new FileNotFoundError(this.path, "Cannot get binary content for directory");
	}
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
		this.rootDir = rootDir.endsWith("/") ? rootDir : rootDir + "/";
	}

	/**
	 * Extracts the repository's and owner's names from the github repo URL
	 */
	private extractOwnerAndRepo(url: string): { owner: string; repo: string } {
		const match = url.match(/github\.com\/([^\/]+)\/([^\/]+)/);
		if (!match) {
			throw new Error("Invalid GitHub repository URL");
		}
		const [, owner, repo] = match;
		return { owner, repo };
	}

	/**
	 * Retrieves the list of directories path without the files they contain
	 * @returns A promise that resolves to an array of directory paths
	 */
	async getTreeContent() {
		const { data: refData } = await this.octokit.rest.git.getRef({
			owner: this.owner,
			repo: this.repo,
			ref: "heads/main"
		});

		const { data: treeData } = await this.octokit.rest.git.getTree({
			owner: this.owner,
			repo: this.repo,
			tree_sha: refData.object.sha,
			recursive: "true"
		});

		const directories = treeData.tree
			.filter((item) => item.type === "tree" && item.path)
			.map((item) => item.path) as string[];

		return directories;
	}

	/**
	 * Creates or updates a text file on the github repository
	 * @param path The path of the file
	 * @param content New text content of the file
	 * @returns A promise that resolves to void on success, or rejects with an error
	 */
	async updateTextFile(path: string, content: string) {
		try {
			await composeCreateOrUpdateTextFile(this.octokit, {
				owner: this.owner,
				repo: this.repo,
				path: sanitizePath(path, this.rootDir),
				content,
				message: `Updated '${path}'`
			});
		} catch (err) {
			throw new FileUpdateError(
				path,
				`Error while updating text content in Gihub repository: '${(err as Error).message}'`
			);
		}
	}

	updateBinaryFile(path: string, content: Buffer): Promise<void> {
		throw new Error("Method not implemented.");
	}

	async deleteFile(path: string) {
		try {
			await composeCreateOrUpdateTextFile(this.octokit, {
				owner: this.owner,
				repo: this.repo,
				path: sanitizePath(path, this.rootDir),
				content: null,
				message: `Deleted '${path}'`
			});
		} catch (err) {
			throw new FileUpdateError(
				path,
				`Error while deleting file in Gihub repository: '${(err as Error).message}'`
			);
		}
	}

	async listDirectoryContent(dirPath: string) {
		const entries: ResourceInfo[] = [];

		// Get the directory content from the github repository
		const { data } = await this.octokit.rest.repos.getContent({
			owner: this.owner,
			repo: this.repo,
			path: sanitizePath(dirPath, this.rootDir)
		});

		if (Array.isArray(data)) {
			// Extract the file names from the directory content
			for (const { type, path, size, content } of data) {
				if (type === "file") {
					entries.push(new GithubFileInfo(removeRootDir(path, this.rootDir), size, content));
				}
				if (type === "dir") {
					entries.push(new GithubDirInfo(removeRootDir(path, this.rootDir) + "/", size));
				}
			}
		}

		console.log(`Listing of '${dirPath}':\n`, entries.join("\n"));

		return entries;
	}

	createDirectory(path: string): Promise<void> {
		throw new Error("Method not implemented.");
	}

	deleteDirectory(path: string): Promise<void> {
		throw new Error("Method not implemented.");
	}
}
