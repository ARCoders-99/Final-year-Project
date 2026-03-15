import { GoogleGenerativeAI } from "@google/generative-ai";
import OpenAI from "openai";
import Groq from "groq-sdk";
import nlp from "compromise";
import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";

export const processText = catchAsyncErrors(async (req, res, next) => {
    const { text, action, targetLanguage } = req.body;

    if (!text) {
        return next(new ErrorHandler("Text is required", 400));
    }

    if (!process.env.GEMINI_API_KEY) {
        return next(new ErrorHandler("AI feature is not configured. Please add GEMINI_API_KEY in backend config.", 500));
    }

    let prompt = "";
    switch (action) {
        case "explain":
            prompt = `Explain the meaning of the following text in a concise and helpful way: "${text}"`;
            break;
        case "simplify":
            prompt = `Rewrite the following text in simpler, easier-to-understand language: "${text}"`;
            break;
        case "translate":
            if (!targetLanguage) {
                return next(new ErrorHandler("Target language is required for translation", 400));
            }
            prompt = `Translate the following text into ${targetLanguage}: "${text}"`;
            break;
        default:
            return next(new ErrorHandler("Invalid action specified", 400));
    }

    let resultText = "";
    let lastError = null;

    // 1. Try Groq AI (Llama 3)
    if (process.env.GROQ_API_KEY) {
        try {
            const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "llama-3.3-70b-versatile",
                max_tokens: 500,
            });
            resultText = chatCompletion.choices[0]?.message?.content || "";
            if (resultText) {
                return res.status(200).json({ success: true, result: resultText });
            }
        } catch (error) {
            lastError = error;
        }
    }

    // 2. Fallback to Gemini AI
    if (process.env.GEMINI_API_KEY) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash", "gemini-1.5-pro"];

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                resultText = response.text();

                if (resultText) {
                    return res.status(200).json({ success: true, result: resultText });
                }
            } catch (error) {
                lastError = error;
            }
        }
    }

    return next(new ErrorHandler(`AI Error: ${lastError?.message || "All models failed"}`, 500));
});

const cleanStoryText = (text) => {
    // Remove Project Gutenberg headers/footers, license blocks, and common noise
    let cleaned = text
        .replace(/^[.\s\S]*?\*\*\* START OF [.\s\S]*?\*\*\*/i, "")
        .replace(/\*\*\* END OF [.\s\S]*?\*\*\*[.\s\S]*$/i, "")
        .replace(/Project Gutenberg eBook.*|Project Gutenberg.*License/gi, "")
        .replace(/\bContents\b|Chapter \d+/gi, "")
        .replace(/Woman's Club|Woman s Club|Produced by|Distributed by/gi, "")
        .replace(/[,—‘’]/g, " ")
        .replace(/\s+/g, " ")
        .trim();

    return cleaned.length > 50 ? cleaned : text.trim();
};

const offlineStoryAnalyzer = (storyText) => {
    const cleanedText = cleanStoryText(storyText);
    const doc = nlp(cleanedText);

    // 1. Detect People (Characters)
    const people = doc.people().out('array');
    const blacklist = [
        "Woman", "Man", "Boy", "Girl", "Club", "Society", "School", "University",
        "State", "Country", "City", "Street", "House", "Room", "Door", "Window",
        "Chapter", "Page", "Book", "Author", "Gutenberg", "Project", "License",
        "Street", "Avenue", "Road", "Park", "General", "Major", "Captain", "Private"
    ];

    const nameMap = new Map();
    people.forEach(name => {
        let cleanedName = name.replace(/[.,;?!—:]+$/g, "").trim();
        let normalizedForMapping = cleanedName.replace(/^(Mr|Ms|Mrs|Dr|Sir|Lady|Colonel|Major)\.?\s+/i, "").trim();
        const isBlacklisted = blacklist.some(term => cleanedName.toLowerCase().includes(term.toLowerCase()));

        if (normalizedForMapping.length > 2 && !isBlacklisted &&
            !["I", "You", "He", "She", "They", "Them", "The", "And", "Mrs", "Sir"].includes(normalizedForMapping)) {
            const key = normalizedForMapping.toLowerCase();
            if (!nameMap.has(key) || cleanedName.length > nameMap.get(key).length) {
                nameMap.set(key, cleanedName);
            }
        }
    });

    const characters = Array.from(nameMap.values()).slice(0, 6);

    // 2. Detect Themes
    const keywords = {
        "Romance/Love": ["love", "marriage", "heart", "passion", "feeling", "kiss", "lover", "darling", "wed", "bride"],
        "Conflict/War": ["war", "battle", "fight", "struggle", "enemy", "weapon", "blood", "army", "soldier", "death"],
        "Mystery/Secrets": ["mystery", "secret", "hidden", "unknown", "riddle", "detective", "clue", "shadow", "murder"],
        "Adventure/Journey": ["journey", "adventure", "quest", "travel", "explore", "wilderness", "path", "mountain", "sea"],
        "Drama/Family": ["family", "mother", "father", "son", "daughter", "tears", "emotional", "home", "parent"],
        "Supernatural": ["magic", "ghost", "darkness", "power", "spirit", "ancient", "spell", "witch", "beast"]
    };

    const themes = [];
    Object.entries(keywords).forEach(([theme, words]) => {
        if (words.some(word => cleanedText.toLowerCase().includes(word))) {
            themes.push(theme);
        }
    });
    if (themes.length === 0) themes.push("Contextual Narrative");

    // 3. Relationships (Improved Proximity Heuristic)
    const relationships = [];
    const sentences = doc.sentences().out('array');
    const interactionMap = new Map();

    if (characters.length >= 2) {
        sentences.forEach(sentence => {
            const lowerSentence = sentence.toLowerCase();
            for (let i = 0; i < characters.length; i++) {
                for (let j = i + 1; j < characters.length; j++) {
                    const p1 = characters[i].replace(/^(Mr|Ms|Mrs|Dr|Sir|Lady|Colonel|Major)\.?/i, "").trim().toLowerCase();
                    const p2 = characters[j].replace(/^(Mr|Ms|Mrs|Dr|Sir|Lady|Colonel|Major)\.?/i, "").trim().toLowerCase();

                    if (lowerSentence.includes(p1) && lowerSentence.includes(p2)) {
                        const key = [characters[i], characters[j]].sort().join(" & ");
                        interactionMap.set(key, (interactionMap.get(key) || 0) + 1);
                    }
                }
            }
        });

        // Limit to top 2-3 most important narrative connections
        const sortedInteractions = Array.from(interactionMap.entries())
            .sort((a, b) => b[1] - a[1])
            .slice(0, 3);

        if (sortedInteractions.length > 0) {
            sortedInteractions.forEach(([pair]) => {
                const names = pair.split(" & ");
                relationships.push(`${names[0]} and ${names[1]} share a key narrative connection.`);
            });
        } else {
            relationships.push(`${characters[0]} and ${characters[1]} are core interacting figures.`);
        }
    } else if (characters.length === 1) {
        relationships.push(`Explores the internal journey and growth of ${characters[0]}.`);
    } else {
        relationships.push(`Multiple narrative threads converge around the primary figures.`);
    }

    // 4. Truncate summary at sentence boundary (more brief, ~150-200 words)
    let summary = cleanedText.slice(0, 1000).trim();
    const lastPunctuation = Math.max(summary.lastIndexOf("."), summary.lastIndexOf("!"), summary.lastIndexOf("?"));
    if (lastPunctuation > 200) {
        summary = summary.slice(0, lastPunctuation + 1);
    } else if (summary.length >= 1000) {
        summary = summary + "...";
    }

    // 5. Return Structured Data
    return {
        characters,
        relationships,
        themes: themes.slice(0, 3),
        summary
    };
};

export const analyzeStory = catchAsyncErrors(async (req, res, next) => {
    const { text } = req.body;

    if (!text) {
        return next(new ErrorHandler("Text is required for analysis", 400));
    }

    let aIAnalysis = null;
    let lastError = null;

    // 1. Try Groq AI (Primary for deep analysis)
    if (process.env.GROQ_API_KEY) {
        try {
            const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });

            const prompt = `Analyze the following story text and provide a structured JSON response.
            
            Text: "${text.substring(0, 5000)}" 
            
            Tasks:
            1. Identify the main characters.
            2. Describe key relationships between them.
            3. Identify the primary themes.
            4. Provide a concise narrative summary (approx 150 words).
            
            Return ONLY the following JSON format:
            {
              "characters": ["Name1", "Name2", "..."],
              "relationships": ["Desc1", "Desc2", "..."],
              "themes": ["Theme1", "Theme2", "..."],
              "summary": "The narrative summary text"
            }
            Do not include any text outside the JSON block.`;

            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "llama-3.3-70b-versatile",
                response_format: { type: "json_object" },
            });

            const content = chatCompletion.choices[0]?.message?.content;
            if (content) {
                const jsonMatch = content.match(/\{[\s\S]*\}/);
                if (jsonMatch) aIAnalysis = JSON.parse(jsonMatch[0]);
            }
        } catch (error) {
            lastError = error;
        }
    }

    // 2. Fallback to Gemini AI
    if (!aIAnalysis && process.env.GEMINI_API_KEY) {
        try {
            const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
            const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

            const prompt = `Analyze this story and return JSON:
            {
              "characters": ["Name1", "..."],
              "relationships": ["..."],
              "themes": ["..."],
              "summary": "..."
            }
            Story text: "${text.substring(0, 3000)}"`;

            const result = await model.generateContent(prompt);
            const response = await result.response;
            const content = response.text();
            const jsonMatch = content.match(/\{[\s\S]*\}/);
            if (jsonMatch) aIAnalysis = JSON.parse(jsonMatch[0]);
        } catch (error) {
            lastError = error;
        }
    }

    // 3. Fallback to Offline rule-based analyzer
    if (!aIAnalysis) {
        aIAnalysis = offlineStoryAnalyzer(text);
    }

    res.status(200).json({
        success: true,
        analysis: aIAnalysis,
        isAI: !!(aIAnalysis && !aIAnalysis.isOffline) // Metadata for frontend
    });
});

export const recommendBooksByMood = catchAsyncErrors(async (req, res, next) => {
    const { query, books } = req.body;

    if (!query) {
        return next(new ErrorHandler("Search query is required", 400));
    }

    if (!books || !Array.isArray(books) || books.length === 0) {
        return next(new ErrorHandler("Books list is required for recommendation", 400));
    }

    const bookListString = books.map(b => `ID: ${b._id}, Title: ${b.title}, Author: ${b.author}`).join("\n");

    const prompt = `You are a helpful library assistant. A user is looking for books and says: "${query}"
    
    Here is the list of available books:
    ${bookListString}
    
    Tasks:
    1. Understand the user's intent (could be a mood, a specific author, a genre, or a topic).
    2. Select up to 10 books from the list that best match this intent.
    3. Return your response ONLY in the following JSON format:
    {
      "detectedMood": "A short descriptive label of their intent/mood",
      "recommendedIds": ["id1", "id2", "..."],
      "explanation": "A very brief explanation of why these match (max 15 words)"
    }
    Do not provide any text outside the JSON block.`;

    let resultText = "";
    let lastError = null;

    // 1. Try Groq AI
    if (process.env.GROQ_API_KEY) {
        try {
            const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
            const chatCompletion = await groq.chat.completions.create({
                messages: [{ role: "user", content: prompt }],
                model: "llama-3.3-70b-versatile",
                response_format: { type: "json_object" }
            });
            resultText = chatCompletion.choices[0]?.message?.content || "";
            if (resultText) {
                const recommendations = JSON.parse(resultText.match(/\{[\s\S]*\}/)[0]);
                return res.status(200).json({ success: true, ...recommendations });
            }
        } catch (error) {
            lastError = error;
        }
    }

    // 2. Fallback to Gemini
    if (process.env.GEMINI_API_KEY) {
        const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
        const modelsToTry = ["gemini-1.5-flash", "gemini-2.0-flash"];

        for (const modelName of modelsToTry) {
            try {
                const model = genAI.getGenerativeModel({ model: modelName });
                const result = await model.generateContent(prompt);
                const response = await result.response;
                resultText = response.text();

                if (resultText) {
                    const jsonMatch = resultText.match(/\{[\s\S]*\}/);
                    if (jsonMatch) {
                        const recommendations = JSON.parse(jsonMatch[0]);
                        return res.status(200).json({ success: true, ...recommendations });
                    }
                }
            } catch (error) {
                lastError = error;
            }
        }
    }

    return next(new ErrorHandler(`AI Mood Search Error: ${lastError?.message || "All providers failed"}`, 500));
});
