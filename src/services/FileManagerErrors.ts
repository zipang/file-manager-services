/**
 * An error thrown by a FileManager instance to report any failure
 * of the expected file operation
 */
export class FileManagerError extends Error {
	constructor(code: number, message: string, details?: string) {
		super(message);
		this.name = "FileManagerError";
		this.code = code;
		if (details) {
			this.details = details;
		}
	}

	code: number;
	details?: string;
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
 * An error specifically thrown when the resource path is invalid
 */
export class PathError extends FileManagerError {
	constructor(path: string, message = "PathError") {
		super(400, message, path);
		this.name = "PathError";
	}
}
