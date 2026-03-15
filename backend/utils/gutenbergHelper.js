/**
 * Generates Gutenberg directory prefix path from ID.
 * Example: 1513 -> 1/5/1
 */
const getGutenbergPath = (id) => {
    const idStr = String(id);
    const pathParts = idStr.slice(0, -1).split("");
    return pathParts.length > 0 ? pathParts.join("/") : "0";
};

/**
 * Builds a list of candidate URLs for reaching a Gutenberg book.
 * aleph.pglaf.org is a verified-reachable mirror when gutenberg.org is blocked.
 */
const getGutenbergMirrors = (id) => {
    const path = getGutenbergPath(id);
    return [
        // aleph.pglaf.org - CONFIRMED reachable from this server
        `https://aleph.pglaf.org/${path}/${id}/${id}-h/${id}-h.htm`,
        `https://aleph.pglaf.org/${path}/${id}/${id}-h.htm`,
        `https://aleph.pglaf.org/${path}/${id}/${id}-0.txt`,
        `https://aleph.pglaf.org/${path}/${id}/${id}.txt`,
        `https://aleph.pglaf.org/${path}/${id}/pg${id}.txt`,

        // www.gutenberg.org - may be blocked, but try anyway
        `https://www.gutenberg.org/ebooks/${id}.html.images`,
        `https://www.gutenberg.org/cache/epub/${id}/pg${id}-images.html`,
        `https://www.gutenberg.org/cache/epub/${id}/pg${id}.html`,
        `https://www.gutenberg.org/cache/epub/${id}/pg${id}.txt`,

        // Additional mirrors
        `https://gutenberg.pglaf.org/${path}/${id}/${id}-h/${id}-h.htm`,
        `https://mirror.cs.princeton.edu/pub/gutenberg/${path}/${id}/${id}-h/${id}-h.htm`,
    ];
};

/**
 * Fetches Gutenberg book content with automatic mirror failover.
 * Tries the stored htmlLink first, then falls back to mirrors.
 * Plain-text books are wrapped in simple HTML for the reader.
 */
export const fetchGutenbergContent = async (id, primaryLink) => {
    const mirrors = [primaryLink, ...getGutenbergMirrors(id)].filter(Boolean);
    const uniqueMirrors = [...new Set(mirrors)];

    for (const url of uniqueMirrors) {
        try {
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 8000);

            const response = await fetch(url, {
                signal: controller.signal,
                headers: {
                    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
                }
            });

            clearTimeout(timeoutId);

            if (response.ok) {
                let text = await response.text();
                if (text && text.length > 500) {
                    const contentType = response.headers.get("content-type") || "";
                    if (contentType.includes("text/plain") || url.endsWith(".txt")) {
                        text = `<!DOCTYPE html><html><head><meta charset="utf-8"><style>body{font-family:Georgia,serif;max-width:800px;margin:auto;padding:2rem;line-height:1.8;white-space:pre-wrap}</style></head><body>${text}</body></html>`;
                    }
                    return { content: text, sourceUrl: url };
                }
            }
        } catch (err) {
            // Silently try next mirror
        }
    }

    throw new Error("Failed to fetch book content from all available Gutenberg mirrors.");
};
