import { FileManagerError } from "./FileManagerErrors";
import { GithubFileManager, GithubFileManagerOptions } from "./GithubFileManager";
import { InMemoryFileManager } from "./InMemoryFileManager";
import { LocalFileManager, LocalFileManagerOptions } from "./LocalFileManager";

export type FileManagerOptions = GithubFileManagerOptions | LocalFileManagerOptions;

/**
 * Factory that create one of the various FileManager implementations.
 */
export class FileManagerFactory {
	/**
	 * @param storeUrl The URL of the file manager store to use
	 * @param options
	 * @returns FileManagerInterface
	 */
	static createFileManager(storeUrl: string, options?: FileManagerOptions) {
		const [type, store] = storeUrl.split(":");

		switch (type) {
			case "https":
				if (!storeUrl.startsWith("https://github.com/")) {
					break;
				}
				return new GithubFileManager({
					...(options as GithubFileManagerOptions),
					githubRepoUrl: storeUrl,
				});
			case "memory":
				return new InMemoryFileManager();
			case "file":
				return new LocalFileManager({
					rootDir: store,
				});
			default:
				throw new FileManagerError(400, `Unknown file manager type: ${type}`);
		}
	}
}
