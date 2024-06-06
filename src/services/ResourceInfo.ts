import { FileManagerError } from "./FileManagerErrors";
import { normalizePath } from "./utils";

export interface ResourceInfoOptions {
	/**
	 * The root directory of the File System
	 */
	rootDir?: string;
	/**
	 * The type of the resource (file or directory)
	 * If not specified, the type will be inferred from the path
	 */
	type?: "file" | "dir";
}

/**
 * Describes a resource of a File System
 * This minimal implementation will enforce our rules on resources paths :
 * - each path starts with a slash (/) meaning that it is the full path from the rootDir of the File System
 * - directories paths always end with a trailing slash (/)
 * - files paths do not end with a trailing slash (/) and MUST have an extension
 */
export class ResourceInfo {
	private _path: string;

	constructor(rscPath?: string, options: ResourceInfoOptions = {}) {
		if (!rscPath) {
			throw new FileManagerError(400, "Empty path specified for resource");
		}

		let { rootDir = "", type } = options;

		if (!type) {
			// Detect a file path to the presence of a file extension
			type = rscPath.match(/\.[a-zA-Z]+$/) ? "file" : "dir";
		}

		this._path = normalizePath(rscPath.replace(normalizePath(rootDir), ""), {
			addLeadingSlash: true,
			addTrailingSlash: type === "dir"
		});
	}

	/**
	 * The path to the resource (file or directory)
	 * Each directory path ends with a trailing `/`.
	 */
	get path(): string {
		return this._path;
	}

	/**
	 * @returns the name of the file or of the directory
	 */
	get name(): string {
		const parts = this._path.split("/").filter(Boolean);
		return parts.pop() || "<root>";
	}

	/**
	 * @returns the path to the parent directory
	 */
	get parent(): string {
		return this._path.substring(0, this._path.lastIndexOf("/"));
	}

	/**
	 * @returns the extension of the file
	 */
	get ext(): string {
		if (!this.isFile) {
			throw new FileManagerError(400, "The resource is not a file");
		}
		return this.name.split(".").pop() || "";
	}

	/**
	 * @returns TRUE if the resource is a known text format
	 */
	get isText(): boolean {
		return Boolean(this.ext.match(/txt|html|css|js|json|md|xml|yml|yaml/));
	}

	/**
	 * @returns TRUE if the path is a directory, FALSE otherwise
	 */
	get isDirectory(): boolean {
		return this._path.endsWith("/");
	}

	/**
	 * @returns TRUE if the path is a file, FALSE otherwise
	 */
	get isFile(): boolean {
		return !this._path.endsWith("/");
	}

	toString(): string {
		return this._path;
	}
}
