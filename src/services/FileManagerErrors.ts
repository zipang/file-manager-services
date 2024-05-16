/**
 * An error thrown by a FileManager instance to report any failure
 * of the expected file operation
 */
export class FileManagerError extends Error {
	constructor(code: number, message: string, path?: string) {
		super(message);
		this.name = "FileManagerError";
		this.code = code;
		this.path = path;
	}

	code: number;
	path?: string;
}

/**
 * An error specifically thrown when a file does not exist
 */
export class FileNotFoundError extends FileManagerError {
	constructor(path: string, message = "FileNotFoundError") {
		super(404, message, path);
		this.name = "FileNotFoundError";
	}
}

/**
 * An error thrown when the file content couldn't be updated
 */
export class FileUpdateError extends FileManagerError {
	constructor(path: string, message = "FileUpdateError") {
		super(500, message, path);
		this.name = "FileUpdateError";
	}
}

/**
 * An error specifically thrown when the resource path is invalid
 */
export class PathError extends FileManagerError {
	constructor(path: string, message = "PathError") {
		super(404, message, path);
		this.name = "PathError";
	}
}
