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
