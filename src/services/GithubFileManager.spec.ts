import { beforeAll, describe, it } from "bun:test";
import { testSuite } from "./FileManager.spec";
import { GithubFileManager } from "./GithubFileManager";

function createFileManager() {
	return new GithubFileManager({
		githubRepoUrl: process.env.GITHUB_TEST_REPO_URL as string,
		githubApplicationToken: process.env.GITHUB_TEST_APP_TOKEN as string
	});
}

async function cleanup() {
	return new GithubFileManager({
		githubRepoUrl: process.env.GITHUB_TEST_REPO_URL as string,
		githubApplicationToken: process.env.GITHUB_TEST_APP_TOKEN as string
	}).deleteDirectory("/tests/");
}

describe("GithubFileManager", async () => {
	beforeAll(() => {
		if (!process.env.GITHUB_TEST_REPO_URL) {
			throw new Error(
				"Environement variables are needed to create the GithubFileManager : GITHUB_TEST_REPO_URL, GITHUB_TEST_APP_TOKEN"
			);
		}
	});

	it("Should pass the common test suite", async () => {
		await testSuite("GithubFileManager", createFileManager, cleanup)();
	});
});
