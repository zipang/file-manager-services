# File Manager Services

This package provides a set of services for managing files on various backend services. All implementations adhere to the `FileManagerInterface`, ensuring consistent functionality across different providers.

## Features

- Create, read, update, and delete files and directories
- List directory contents and retrieve file tree structure
- Consistent interface across different backend services
- Easy to extend with new service implementations

## Available Implementations

The package includes three implementations:

1. `GithubFileManager`: Manages files and directories on GitHub repositories.
2. `GoogleDriveFileManager`: Manages files and directories on Google Drive.
3. `InMemoryFileManager`: A memory-based implementation useful for testing and debugging.

## FileManagerInterface

All implementations adhere to the `FileManagerInterface`, which defines the following methods:

- `getTreeContent(): Promise<ResourceInfo[]>`
- `getFileContent(path: string): Promise<string | Buffer>`
- `updateTextFile(path: string, content: string): Promise<void>`
- `updateBinaryFile(path: string, content: Buffer): Promise<void>`
- `deleteFile(path: string): Promise<void>`
- `listDirectoryContent(path: string): Promise<ResourceInfo[]>`
- `createDirectory(path: string): Promise<void>`
- `deleteDirectory(path: string): Promise<void>`

## ResourceInfo

The `ResourceInfo` interface represents information about a file or directory. It includes the following properties:

- `path`: The full path to the resource (file or directory). Directory paths end with a trailing `/`.
- `name`: The name of the file or directory.
- `parent`: The path to the parent directory.
- `ext`: The file extension (only for files).
- `isText`: A boolean indicating if the resource is a known text format.
- `isDirectory`: A boolean indicating if the resource is a directory.
- `isFile`: A boolean indicating if the resource is a file.

## Usage

To use a file manager service:

1. Import the desired implementation
2. Initialize it with the necessary options
3. Use the interface methods to perform file operations

**Usage Example with GithubFileManager:**

```typescript
import { GithubFileManager } from './services/GithubFileManager';

const githubManager = new GithubFileManager({
  githubRepoUrl: 'https://github.com/user/repo',
  githubApplicationToken: 'your-github-token',
  rootDir: 'optional/root/directory'
});

// List directory content
const files = await githubManager.listDirectoryContent('/path/to/directory');

// Update a text file
await githubManager.updateTextFile('/path/to/file.txt', 'New content');

// Delete a file
await githubManager.deleteFile('/path/to/file.txt');

```

## Environment Variables

To run the tests for the FileManager, you need to set up the following environment variables:

1. Copy the `.env.sample` file to a new file named `.env.test`:
2. Edit the `.env.test` file and replace the placeholder values with your actual GitHub test repository URL and application token:
3. The test suite will automatically use these environment variables when running the tests.

Note: The `.env` file is ignored by git to keep your credentials secure. _Never commit this file to the repository_.
