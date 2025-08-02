import { describe, expect, it } from "bun:test";
import { FileManagerError } from "../services/FileManagerErrors";
import { ResourceInfo } from "./ResourceInfo";

describe("ResourceInfo", () => {
	describe("constructor and path normalization", () => {
		it("should throw if path is empty", () => {
			expect(() => new ResourceInfo("")).toThrow(FileManagerError);
		});

		it("should normalize file path and remove rootDir", () => {
			const rsc = new ResourceInfo("/root/dir/file.txt", {
				rootDir: "/root"
			});
			expect(rsc.path).toBe("/dir/file.txt");
		});

		it("should normalize directory path and remove rootDir", () => {
			const rsc = new ResourceInfo("/root/dir/sub/", {
				rootDir: "/root"
			});
			expect(rsc.path).toBe("/dir/sub/");
		});

		it("should add leading slash if missing", () => {
			const rsc = new ResourceInfo("foo/bar.txt");
			expect(rsc.path.startsWith("/")).toBe(true);
		});

		it("should automatically add trailing slash for directories", () => {
			const rsc = new ResourceInfo("/foo/bar", { type: "dir" });
			expect(rsc.path.endsWith("/")).toBe(true);
		});

		it("should not add trailing slash for files", () => {
			const rsc = new ResourceInfo("/foo/bar.txt", { type: "file" });
			expect(rsc.path.endsWith("/")).toBe(false);
		});
	});

	describe("resource's isFile vs isDirectory", () => {
		it("should infer file type from extension", () => {
			const rsc = new ResourceInfo("/foo/bar.txt");
			expect(rsc.isFile).toBe(true);
			expect(rsc.isDirectory).toBe(false);
		});

		it("should infer directory type from lack of extension", () => {
			const rsc = new ResourceInfo("/foo/bar/");
			expect(rsc.isDirectory).toBe(true);
			expect(rsc.isFile).toBe(false);
		});
	});

	describe("resource's name", () => {
		it("should return file name without extension", () => {
			const rsc = new ResourceInfo("/foo/bar.txt");
			expect(rsc.name).toBe("bar");
		});

		it("should return directory name", () => {
			const rsc = new ResourceInfo("/foo/baz/");
			expect(rsc.name).toBe("baz");
		});

		it("should return <root> for root directory", () => {
			const rsc = new ResourceInfo("/");
			expect(rsc.name).toBe("<root>");
		});

		it("should handle files with multiple dots", () => {
			const rsc = new ResourceInfo("/foo/archive.tar.gz");
			expect(rsc.name).toBe("archive");
			expect(rsc.ext).toBe("tar.gz");
		});

		it("should handle files with no extension", () => {
			const rsc = new ResourceInfo("/foo/README", { type: "file" });
			expect(rsc.name).toBe("README");
		});
	});

	describe("resource's fullname", () => {
		it("should return the full name for a file", () => {
			const rsc = new ResourceInfo("/foo/bar.txt");
			expect(rsc.fullname).toBe("bar.txt");
		});

		it("should return the full name for a file with multiple dots", () => {
			const rsc = new ResourceInfo("/foo/archive.tar.gz");
			expect(rsc.fullname).toBe("archive.tar.gz");
		});

		it("should return the name for a directory", () => {
			const rsc = new ResourceInfo("/foo/baz/");
			expect(rsc.fullname).toBe("baz");
		});

		it("should return <root> for the root directory", () => {
			const rsc = new ResourceInfo("/");
			expect(rsc.fullname).toBe("<root>");
		});
	});

	describe("resource's parent", () => {
		it("should return parent directory for file", () => {
			const rsc = new ResourceInfo("/foo/bar/baz.txt");
			expect(rsc.parent).toBeInstanceOf(ResourceInfo);
			expect(rsc.parent?.path).toBe("/foo/bar/");
		});

		it("should return parent directory for directory", () => {
			const rsc = new ResourceInfo("/foo/bar/");
			expect(rsc.parent).toBeInstanceOf(ResourceInfo);
			expect(rsc.parent?.path).toBe("/foo/");
		});

		it("should return root for top-level directory", () => {
			const rsc = new ResourceInfo("/foo/");
			expect(rsc.parent).toBeInstanceOf(ResourceInfo);
			expect(rsc.parent?.path).toBe("/");
		});

		it("should return root for top-level file", () => {
			const rsc = new ResourceInfo("/foo.txt");
			expect(rsc.parent).toBeInstanceOf(ResourceInfo);
			expect(rsc.parent?.path).toBe("/");
		});

		it("should return null for the root parent", () => {
			const rsc = new ResourceInfo("/");
			expect(rsc.path).toEqual("/");
			expect(rsc.isDirectory).toBeTrue();
			expect(rsc.parent).toBeNull();
		});
	});

	describe("resource's ext", () => {
		it("should return extension for file", () => {
			const rsc = new ResourceInfo("/foo/bar.txt");
			expect(rsc.ext).toBe("txt");
		});

		it("should return full extension for file with multiple dots", () => {
			const rsc = new ResourceInfo("/foo/archive.tar.gz");
			expect(rsc.ext).toBe("tar.gz");
		});

		it("should return empty extension for directory", () => {
			const rsc = new ResourceInfo("/foo/bar/");
			expect(rsc.ext).toBe("");
		});

		it("should return a case insensitive extension (lowercase)", () => {
			const rsc1 = new ResourceInfo("/foo/bar/readme.md");
			const rsc2 = new ResourceInfo("/foo/bar/README.MD");
			expect(rsc1.ext).toEqual(rsc2.ext);
			expect(rsc2.ext).toEqual("md");
		});

		it("should return empty string for file with no extension", () => {
			const rsc = new ResourceInfo("/foo/README", { type: "file" });
			expect(rsc.ext).toBe("");
		});
	});

	describe("resource isText", () => {
		it("should return true for known text extensions", () => {
			const rsc = new ResourceInfo("/foo/bar.md");
			expect(rsc.isText).toBe(true);
		});

		it("should return true for known text extensions (even combined)", () => {
			const rsc = new ResourceInfo("/src/ResourceInfo.spec.ts");
			expect(rsc.isText).toBe(true);
		});

		it("should return false for unknown extensions", () => {
			const rsc = new ResourceInfo("/foo/bar.exe");
			expect(rsc.isText).toBe(false);
		});
	});

	describe("toString() and toJSON()", () => {
		it("toString() returns the resource path", () => {
			const rsc = new ResourceInfo("/foo/bar.txt");
			expect(rsc.toString()).toBe("/foo/bar.txt");
		});

		it("toJSON() returns an object of type file for file", () => {
			const rsc = new ResourceInfo("/foo/bar.txt");
			expect(rsc.toJSON()).toEqual({
				name: "bar",
				ext: "txt",
				path: "/foo/bar.txt",
				isText: true,
				type: "file"
			});
		});

		it("toJSON() returns an object of type folder for directory", () => {
			const rsc = new ResourceInfo("/foo/bar/");
			expect(rsc.toJSON()).toEqual({
				name: "bar",
				path: "/foo/bar/",
				type: "folder"
			});
		});
	});
});
