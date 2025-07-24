import { FileManagerError } from "./FileManagerErrors";
import { normalizePath } from "../utils";

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
 * - each path starts with a slash (/) meaning that it is the full path from the <root> of the File System
 * - directories paths always end with a trailing slash (/)
 * - files paths do not end with a trailing slash (/) and MUST have an extension
 */
export class ResourceInfo {
	private _path: string;

	constructor(rscPath?: string, options: ResourceInfoOptions = {}) {
		if (!rscPath) {
			throw new FileManagerError(
				400,
				`Bad parameter : empty path specified for new resource. 
Use '/' to refer to the <root> directory.`
			);
		}

		let { rootDir = "", type } = options;

		if (!type) {
			if (rscPath.endsWith("/")) {
				type = "dir";
			}
			// last ressort : infer file type by the presence of a file extension
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
	 * @returns the full name of the file (with extension) or of the directory
	 */
	get fullname(): string {
		const pathParts = this._path.split("/").filter(Boolean);
		// @ts-ignore .pop() cannot return undefined if length > 0
		return pathParts.length === 0 ? "<root>" : pathParts.pop();
	}

	/**
	 * @returns the name of the file or of the directory (_without extension_)
	 */
	get name(): string {
		return this.fullname.split(".")[0];
	}

	/**
	 * Parent directory
	 * @returns normalized path to the parent directory or `null` for the <root>
	 */
	get parent(): ResourceInfo | null {
		const pathParts = this._path.split("/").filter(Boolean);
		if (pathParts.length === 0) {
			// No parent for the root
			return null;
		}
		pathParts.pop();
		return new ResourceInfo(`${pathParts.join("/")}/`);
	}

	/**
	 * @returns file's extension (in lowercase)
	 * NOTE: return all extensions combined if there are several (eg: archive.tar.gz => tar.gz)
	 */
	get ext(): string {
		if (this.isFile) {
			const fullname = this.fullname;
			const dotPos = fullname.indexOf(".");
			return dotPos < 0 ? "" : fullname.substring(dotPos + 1).toLowerCase();
		}
		// directories don't have extensions
		return "";
	}

	/**
	 * @returns TRUE if the resource is some known text format
	 */
	get isText(): boolean {
		return Boolean(
			this.ext.match(
				/(txt|md|html|css|js|jsx|ts|tsx|json|jsonc|yml|yaml|toml|log|ini|conf|cfg|env|properties|csv|xml|sh|bat|py|php|java|rb|go|pl|lua|c|cpp|h|hpp|rs|scss|sass|less|tex|rst|sql|vue|astro|dockerfile|mk|groovy|swift|kt|kts|dart|erl|ex|exs|scala)$/i
			)
		);
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

	/**
	 * Use this representation to serialize in JSON
	 */
	toJSON() {
		return this.isDirectory
			? {
					name: this.name,
					path: this.path,
					type: "folder"
				}
			: {
					name: this.name,
					ext: this.ext,
					path: this.path,
					type: "file",
					isText: this.isText
				};
	}
}

export interface FolderContent {
	files: ResourceInfo[];
	folders: ResourceInfo[];
}
