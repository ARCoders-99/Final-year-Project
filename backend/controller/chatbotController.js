import Groq from "groq-sdk";
import { Book } from "../models/bookModel.js";
import { DigitalBook } from "../models/digitalBookModel.js";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";

export const chatWithLibrarian = catchAsyncErrors(async (req, res, next) => {
    const { message, history } = req.body;

    if (!message) {
        return next(new ErrorHandler("Message is required", 400));
    }

    if (!process.env.GROQ_API_KEY) {
        return next(new ErrorHandler("Groq AI is not configured. Please add GROQ_API_KEY in backend config.", 500));
    }

    // Fetch books for context
    const [physicalBooks, digitalBooks] = await Promise.all([
        Book.find().limit(20).select("title author availability price"),
        DigitalBook.find().limit(20).select("title author description price")
    ]);

    const bookContext = [
        ...physicalBooks.map(b => `[Physical] Title: ${b.title}, Author: ${b.author}, Available: ${b.availability ? "Yes" : "No"}`),
        ...digitalBooks.map(b => `[Digital] Title: ${b.title}, Author: ${b.author}, Description: ${b.description?.substring(0, 100)}...`)
    ].join("\n");

    const systemPrompt = `You are the Virtual Librarian for our digital and physical library system. 
    Your name is "Librarian AI". You are friendly, knowledgeable, and professional.
    
    Current Library context (a sample of available books):
    ${bookContext}
    
    Guidelines:
    1. Help users find books by title, author, or interest.
    2. If a user asks for recommendations, use the library context above to suggest relevant books.
    3. If they ask about how to borrow or use the system:
       - Physical books can be borrowed from the "Books" or "Catalog" section.
       - Digital books can be accessed in the "Digital Library" section.
       - To read a digital book, users need to borrow it first.
    4. Keep your answers concise but helpful.
    5. If you don't know something about a specific book not in the context, you can say it might be in our full catalog and suggest they search for it.
    6. Always stay in character as a librarian.`;

    let replyText = "";
    let lastError = null;

    try {
        console.log("Attempting Chatbot request with Groq AI (llama-3.3-70b-versatile)");
        const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

        const groqHistory = (history || []).map(msg => ({
            role: msg.role === "user" ? "user" : "assistant",
            content: msg.content
        }));

        const chatCompletion = await groq.chat.completions.create({
            messages: [
                { role: "system", content: systemPrompt },
                ...groqHistory,
                { role: "user", content: message }
            ],
            model: "llama-3.3-70b-versatile",
            max_tokens: 500,
        });

        replyText = chatCompletion.choices[0]?.message?.content || "";
    } catch (error) {
        console.error("Groq AI failed:", error.message);
        lastError = error;
    }

    // Keyword-based Search Fallback if Groq fails
    if (!replyText) {
        console.log("Groq AI failed. Using keyword-based fallback.");
        const keywords = message.toLowerCase().split(/\s+/).filter(w => w.length > 3);
        const allBooks = [
            ...physicalBooks.map(b => ({ ...b.toObject(), type: 'physical' })),
            ...digitalBooks.map(b => ({ ...b.toObject(), type: 'digital' }))
        ];

        const matches = allBooks.filter(book => {
            const content = `${book.title} ${book.author} ${book.description || ""}`.toLowerCase();
            return keywords.some(keyword => content.includes(keyword));
        }).slice(0, 5);

        if (matches.length > 0) {
            replyText = `I'm having a bit of trouble with my "AI brain" right now, but as a librarian, I've manually searched our shelves for you! \n\nI found these books that might match your interest: \n\n` +
                matches.map(m => `- **${m.title}** by ${m.author}`).join("\n") +
                `\n\nYou can find these in the ${matches[0].type === "digital" ? "Digital Library" : "Books"} section.`;
        } else {
            replyText = "I'm currently experiencing some technical connection issues, and I couldn't find a direct match in my quick search. Please try again in a few minutes, or browse our Catalog and Digital Library sections directly!";
        }
    }

    res.status(200).json({
        success: true,
        reply: replyText,
    });
});
