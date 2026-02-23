const GUTENDEX_API_URL = "https://gutendex.com/books";

export const searchGutenbergBooks = async (query) => {
    try {
        const url = `${GUTENDEX_API_URL}?search=${encodeURIComponent(query)}`;
        console.log("Fetching from Gutendex URL:", url);

        const response = await fetch(url, {
            headers: {
                "User-Agent": "LibrarySystemFYP/1.0 (Contact: admin@example.com)"
            }
        });

        if (!response.ok) {
            console.error("Gutendex API response NOT OK:", response.status, response.statusText);
            throw new Error(`Gutendex API error: ${response.statusText}`);
        }

        const data = await response.json();
        console.log("Gutendex API responded successfully with", data.results?.length || 0, "raw results.");

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
            language: book.languages.join(", "),
            coverImage: findFormat(book.formats, "image/jpeg"),
            htmlLink: findFormat(book.formats, "text/html"),
        }));

        console.log("Mapped results successfully.");
        return mappedResults;
    } catch (error) {
        console.error("Error in searchGutenbergBooks:", error);
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
            language: book.languages.join(", "),
            coverImage: findFormat(book.formats, "image/jpeg"),
            htmlLink: findFormat(book.formats, "text/html"),
        };
    } catch (error) {
        console.error("Error fetching book from Gutendex:", error);
        throw error;
    }
};
