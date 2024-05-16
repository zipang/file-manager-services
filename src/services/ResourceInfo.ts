import { FileManagerError } from "./FileManagerErrors";

export interface ResourceInfoOptions {
	/**
	 * The root directory of the File System
	 */
	rootDir?: string;
	/**
	 * The type of the ressource (file or directory)
	 * If not specified, the type will be inferred from the path
	 */
	type?: "file" | "dir";
}

/**
 * Describes a ressource in the File System
 * This minimal implementation will enforce our rules on resources paths :
 * - each path starts with a slash (/) meaning that it is the full path from the root of the File System
 * - directories paths always end with a trailing slash (/)
 * - files paths do not end with a trailing slash (/) and MUST have an extension
 */
export class ResourceInfo {
	constructor(rscPath?: string, options: ResourceInfoOptions = {}) {
		if (!rscPath) {
			throw new FileManagerError(400, "Empty path specified for resource");
		}

		let { rootDir = "", type } = options;
		if (!type) {
			type = rscPath.endsWith("/") ? "dir" : "file";
		}
		rscPath = rscPath.replace(rootDir, "").split("/").filter(Boolean).join("/");
		this.path = "/" + rscPath + (type === "dir" ? "/" : "");
	}

	/**
	 * The path to the ressource (file or directory)
	 * Each directory path ends with a trailing `/`.
	 */
	path: string;

	/**
	 * @returns the name of the file or of the directory
	 */
	getName() {
		const parts = this.path.split("/").filter(Boolean);
		return parts.pop() || "";
	}

	/**
	 * @returns true if the path is a directory, false otherwise
	 */
	isDirectory() {
		return this.path.endsWith("/");
	}

	/**
	 * @returns true if the path is a file, false otherwise
	 */
	isFile() {
		return !this.path.endsWith("/");
	}
}
