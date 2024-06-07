interface NormalizePathOptions {
	addLeadingSlash?: boolean;
	addTrailingSlash?: boolean;
}

const DEFAULT_OPTIONS = {
	addLeadingSlash: false,
	addTrailingSlash: false
};

/**
 * Normalizes a path by adding a leading slash and/or a trailing slash.
 */
export const normalizePath = (rscPath: string, opts: NormalizePathOptions = DEFAULT_OPTIONS) => {
	if (!rscPath) return "";

	const trimmed = rscPath.split("/").filter(Boolean).join("/");
	return `${opts.addLeadingSlash ? "/" : ""}${trimmed}${opts.addTrailingSlash ? "/" : ""}`;
};

/**
 * Split a resource path to return its parent folder and resource name
 */
export const splitPath = (rscPath: string) => {
	const fileNamePosition = rscPath.lastIndexOf("/") + 1;
	return [
		rscPath.substring(0, fileNamePosition), // path to parent folder
		rscPath.substring(fileNamePosition) // resource's name
	];
};
