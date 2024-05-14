export interface ResourceInfo {
	/**
	 * The path to the ressource (file or directory)
	 * Each directory path ends with a trailing `/`.
	 */
	path: string;
	/**
	 * @returns the name of the file or of the directory
	 */
	getName(): string;
	/**
	 * Get the size in bytes if available or undefined if not available.
	 */
	getSize(): Promise<number | void>;
	/**
	 * Get the binary content of the file.
	 */
	getBinaryContent(): Promise<Buffer | void>;
	/**
	 * Get the text content of the file.
	 */
	getTextContent(): Promise<string | void>;
	/**
	 * @returns true if the path is a directory, false otherwise
	 */
	isDirectory(): boolean;
	/**
	 * @returns true if the path is a file, false otherwise
	 */
	isFile(): boolean;
}

/**
 * This interface describe all the available methods of any FileManager instance
 * The purpose of a FileManager is to create, update, delete files on a backend service.
 * It can also works with directories and list their content, create or delete directories.
 * All FileManager instances are created with specific options, one of them is the root of the file system.
 * The FileManager instance can never access files outside this given root.
 * All path parameters are relatives to this initial root path.
 */
export interface FileManagerInterface {
	/**
	 * Retrieves the list of directories path without the files they contain
	 * @returns A promise that resolves to an array of directory paths
	 */
	getTreeContent(): Promise<string[]>;

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
	 * @param path The path of the directory to list
	 * @returns A promise that resolves to an array of FileInfo objects
	 */
	listDirectoryContent(path: string): Promise<ResourceInfo[]>;

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

/**
 * Defines a Factory for creating a File Manager for a specific backend service
 */
export type FileManagerFactory = (options?: object) => FileManagerInterface;
