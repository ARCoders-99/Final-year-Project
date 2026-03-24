const GUTENDEX_API_URL = "https://gutendex.com/books";

export const searchGutenbergBooks = async (query) => {
    try {
        const url = `${GUTENDEX_API_URL}?search=${encodeURIComponent(query)}`;

        const response = await fetch(url, {
            headers: {
                "User-Agent": "LibrarySystemFYP/1.0 (Contact: admin@example.com)"
            }
        });

        if (!response.ok) {
            throw new Error(`Gutendex API error: ${response.statusText}`);
        }

        const data = await response.json();

        // Helper to find first matching format
        const findFormat = (formats, mimePrefix) => {
            const key = Object.keys(formats).find(k => k.startsWith(mimePrefix));
            return key ? formats[key] : null;
        };

        // Map data to our structure
        const mappedResults = data.results.map((book) => ({
            gutenbergId: book.id,
            title: book.title,
            author: book.authors.map((a) => a.name).join(", "),
            description: book.subjects.slice(0, 3).join(", "),
            coverImage: findFormat(book.formats, "image/jpeg"),
            htmlLink: findFormat(book.formats, "text/html"),
        }));

        return mappedResults;
    } catch (error) {
        throw error;
    }
};

export const getGutenbergBookById = async (id) => {
    try {
        const response = await fetch(`${GUTENDEX_API_URL}/${id}`, {
            headers: {
                "User-Agent": "LibrarySystemFYP/1.0 (Contact: admin@example.com)"
            }
        });
        if (!response.ok) {
            throw new Error(`Gutendex API error: ${response.statusText}`);
        }
        const book = await response.json();

        const findFormat = (formats, mimePrefix) => {
            const key = Object.keys(formats).find(k => k.startsWith(mimePrefix));
            return key ? formats[key] : null;
        };

        return {
            gutenbergId: book.id,
            title: book.title,
            author: book.authors.map((a) => a.name).join(", "),
            description: book.subjects.slice(0, 3).join(", "),
            coverImage: findFormat(book.formats, "image/jpeg"),
            htmlLink: findFormat(book.formats, "text/html"),
        };
    } catch (error) {
        throw error;
    }
};
