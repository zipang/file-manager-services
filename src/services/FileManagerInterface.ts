import type { ResourceInfo } from "./ResourceInfo";

/**
 * This interface describes all the available methods of any FileManager instance
 * The purpose of a FileManager is to create, update, delete files on a backend service.
 * It can also works with directories and list their content, create or delete directories.
 * All FileManager instances are created with specific options, one of them is the root directory of the file system.
 * The FileManager instance can never access files outside this given root directory.
 * All resources paths will start from this initial root path.
 */
export interface FileManagerInterface {
	/**
	 * Retrieves the content of a file on the backend service.
	 * @param path The path of the file to retrieve
	 * @returns A promise that resolves to the text content or to a binary Buffer
	 */
	getFileContent(path: string): Promise<string | Buffer>;

	/**
	 * Get detailed info about the resource on this path
	 * @param path The path of the file or folder
	 */
	getInfo(path: string): ResourceInfo;

	/**
	 * Create or Update a text file on the backend service.
	 * @param path The path of the file to update
	 * @param content The new text content of the file
	 * @returns A promise that resolves to void on success, or rejects with an error
	 */
	updateTextFile(path: string, content: string): Promise<void>;

	/**
	 * Create or Update a binary file on the backend service.
	 * @param path The path of the file to update
	 * @param content The new binary content of the file
	 * @returns A promise that resolves to void on success, or rejects with an error
	 */
	updateBinaryFile(path: string, content: Buffer): Promise<void>;

	/**
	 * Delete a file on the backend service.
	 * @param path The path of the file to delete
	 * @returns A promise that resolves to void on success, or rejects with an error
	 */
	deleteFile(path: string): Promise<void>;

	/**
	 * List the content of a directory on the backend service.
	 * @param {string} path The path of the directory to scan
	 * @param {boolean} recursive Pass TRUE to scan all child directories. Default: FALSE
	 * @returns A promise that resolves to an array of ResourceInfo objects
	 */
	listDirectoryContent(path: string, recursive?: boolean): Promise<ResourceInfo[]>;

	/**
	 * Create a new directory on the backend service.
	 * @param path The path of the directory to create
	 * @returns A promise that resolves to void on success, or rejects with an error
	 */
	createDirectory(path: string): Promise<void>;

	/**
	 * Delete a directory on the backend service.
	 * @param path The path of the directory to delete
	 * @returns A promise that resolves to void on success, or rejects with an error
	 */
	deleteDirectory(path: string): Promise<void>;
}
