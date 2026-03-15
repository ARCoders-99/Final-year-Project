import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { DigitalBook } from "../models/digitalBookModel.js";
import { DigitalBorrow } from "../models/digitalBorrowModel.js";
import { digitalBorrowSchema } from "../utils/validationSchema.js";
import { fetchGutenbergContent } from "../utils/gutenbergHelper.js";

// Borrow Digital Book
export const borrowDigitalBook = catchAsyncErrors(async (req, res, next) => {
    const validation = digitalBorrowSchema.safeParse(req.params);
    if (!validation.success) {
        return next(new ErrorHandler(validation.error.errors[0].message, 400));
    }

    const { id: bookId } = req.params;
    const user = req.user;

    const book = await DigitalBook.findById(bookId);
    if (!book) {
        return next(new ErrorHandler("Digital book not found.", 404));
    }

    // Check price
    if (book.price > 0) {
        return next(new ErrorHandler("This book requires payment before borrowing.", 400));
    }

    // Check if already borrowed and active
    let borrowRecord = await DigitalBorrow.findOne({
        "user.id": user._id,
        book: bookId,
        status: "Active",
        expiryDate: { $gt: new Date() },
    });

    if (borrowRecord) {
        return next(new ErrorHandler("You already have an active borrow for this book.", 400));
    }

    const totalMs =
        ((book.borrowLimitDays || 0) * 86400 +
            (book.borrowLimitHours || 0) * 3600 +
            (book.borrowLimitMinutes || 0) * 60) * 1000;

    if (totalMs <= 0) {
        return next(new ErrorHandler("This book has no borrow limit configured.", 400));
    }

    const expiryDate = new Date(Date.now() + totalMs);

    borrowRecord = await DigitalBorrow.create({
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
        },
        book: bookId,
        expiryDate,
    });

    res.status(201).json({
        success: true,
        message: "Digital book borrowed successfully.",
        borrowRecord,
    });
});

// Record Paid Digital Borrow (After successful Stripe payment)
export const recordPaidDigitalBorrow = catchAsyncErrors(async (req, res, next) => {
    const { id: bookId } = req.params;
    const { sessionId } = req.body;
    const user = req.user;

    if (!sessionId) {
        return next(new ErrorHandler("Payment session ID is required", 400));
    }

    // 1. Verify payment with Stripe
    const Stripe = (await import("stripe")).default;
    if (!process.env.STRIPE_SECRET_KEY) {
        return next(new ErrorHandler("STRIPE_SECRET_KEY is not defined in environment variables", 500));
    }
    const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
    const intent = await stripe.paymentIntents.retrieve(sessionId);

    if (intent.status !== "succeeded") {
        return next(new ErrorHandler("Payment not verified", 400));
    }

    // 2. Check if book exists
    const book = await DigitalBook.findById(bookId);
    if (!book) return next(new ErrorHandler("Digital book not found", 404));

    // 3. Prevent duplicate borrow for same session
    let borrowRecord = await DigitalBorrow.findOne({ paymentId: intent.id });
    if (borrowRecord) {
        return res.status(200).json({ success: true, message: "Book already recorded.", borrowRecord });
    }

    // 4. Calculate expiry date
    const totalMs =
        ((book.borrowLimitDays || 0) * 86400 +
            (book.borrowLimitHours || 0) * 3600 +
            (book.borrowLimitMinutes || 0) * 60) * 1000;

    const expiryDate = new Date(Date.now() + totalMs);

    // 5. Create Digital Borrow record
    borrowRecord = await DigitalBorrow.create({
        user: {
            id: user._id,
            name: user.name,
            email: user.email,
        },
        book: bookId,
        expiryDate,
        paymentId: intent.id,
        paymentStatus: "paid",
        amountPaid: intent.amount / 100,
        paymentDate: new Date(),
    });

    res.status(201).json({
        success: true,
        message: "Payment verified and digital book borrowed successfully!",
        borrowRecord,
    });
});

// Reader Proxy: Fetch HTML from Gutenberg and return it
export const getDigitalReaderContent = catchAsyncErrors(async (req, res, next) => {
    const { id: bookId } = req.params;
    const user = req.user;

    // Verify active borrow
    let borrowRecord = await DigitalBorrow.findOne({
        "user.id": user._id,
        book: bookId,
        status: "Active",
        expiryDate: { $gt: new Date() },
    });

    if (!borrowRecord && user.role !== "Admin") {
        return next(new ErrorHandler("Access denied. No active borrow record found or borrow has expired.", 403));
    }

    const book = await DigitalBook.findById(bookId);
    if (!book) {
        return next(new ErrorHandler("Book not found.", 404));
    }

    try {
        const { content, sourceUrl } = await fetchGutenbergContent(book.gutenbergId, book.htmlLink);

        // Derive the base URL for resolving relative image paths
        const baseUrl = sourceUrl.substring(0, sourceUrl.lastIndexOf("/") + 1);

        // Strip Gutenberg preamble (everything up to and including *** START OF *** line)
        let html = content.replace(/^[\s\S]*?\*{3}\s*START OF (THE |THIS )?PROJECT GUTENBERG[^\*]+\*{3}\s*/i, "");
        // Strip Gutenberg postamble (everything from *** END OF *** line onwards)
        html = html.replace(/\*{3}\s*END OF (THE |THIS )?PROJECT GUTENBERG[\s\S]*/i, "");

        // Inject <meta viewport> and <base> tag
        const metaViewport = '<meta name="viewport" content="width=device-width, initial-scale=1.0">';
        if (/<head>/i.test(html)) {
            html = html.replace(/<head>/i, `<head>${metaViewport}<base href="${baseUrl}">`);
        } else {
            html = `${metaViewport}<base href="${baseUrl}">${html}`;
        }

        // Inject reader styles: centered layout, padding, hide cover image
        const readerStyles = `
        <style>
            /* Layout */
            body {
                width: 100% !important;
                max-width: 800px !important;
                margin: 0 auto !important;
                padding: 1rem !important;
                box-sizing: border-box !important;
                font-family: Georgia, 'Times New Roman', serif !important;
                font-size: 1.1rem !important;
                line-height: 1.7 !important;
                color: #1a1a1a !important;
                background: #fff !important;
                overflow-x: hidden !important;
            }
            @media (min-width: 768px) {
                body {
                    padding: 2rem 3rem !important;
                    font-size: 1.2rem !important;
                }
            }
            /* Hide Gutenberg cover image (common patterns) */
            .cover, #cover, figure.cover, div.cover,
            div[id^="cover"], .coverpage, #coverpage,
            .title-page img, .pgmonospaced img:first-child {
                display: none !important;
            }
            /* Remove extra top margin caused by hidden cover */
            body > *:first-child { margin-top: 0 !important; }
            /* Nice paragraph spacing */
            p { margin: 0 0 0.75em 0; }
            /* Responsive images */
            img { max-width: 100%; height: auto; }
        </style>
        <script>
            // Aggressively remove cover image on DOM ready
            document.addEventListener('DOMContentLoaded', function() {
                // Strategy 1: find elements with cover-related class/id
                ['cover','coverpage','title-page','cover-image','book-cover'].forEach(function(name) {
                    var el = document.querySelector('.' + name + ', #' + name);
                    if (el) el.remove();
                });
                // Strategy 2: remove the first <img> if it is large (likely a cover)
                var imgs = document.body.querySelectorAll('img');
                if (imgs.length > 0) {
                    var first = imgs[0];
                    // If it's near the top of the page it's likely the cover
                    var parent = first.parentElement;
                    var grandParent = parent ? parent.parentElement : null;
                    // Walk up to remove the containing block if it only contains the image
                    if (parent && parent.children.length <= 2) {
                        parent.remove();
                    } else if (grandParent && grandParent.children.length <= 2) {
                        grandParent.remove();
                    } else {
                        first.remove();
                    }
                }
            });
        </script>`;

        // Inject styles into <head> if possible
        if (html.includes("</head>")) {
            html = html.replace("</head>", `${readerStyles}</head>`);
        } else if (html.includes("</HEAD>")) {
            html = html.replace("</HEAD>", `${readerStyles}</HEAD>`);
        } else {
            html = `${readerStyles}${html}`;
        }

        // Inject selection helper script
        const selectionScript = `
            <script>
                document.addEventListener('mouseup', () => {
                    const selection = window.getSelection().toString().trim();
                    if (selection) {
                        const range = window.getSelection().getRangeAt(0);
                        const rect = range.getBoundingClientRect();
                        window.parent.postMessage({
                            type: 'TEXT_SELECTION',
                            text: selection,
                            rect: {
                                top: rect.top,
                                left: rect.left,
                                width: rect.width,
                                height: rect.height
                            }
                        }, '*');
                    } else {
                        window.parent.postMessage({ type: 'CLEAR_SELECTION' }, '*');
                    }
                });

                window.addEventListener('message', (event) => {
                    if (event.data.type === 'GET_FULL_TEXT') {
                        // Extract text from the whole body, stripping scripts and styles
                        const body = document.body.cloneNode(true);
                        const scripts = body.getElementsByTagName('script');
                        while (scripts[0]) scripts[0].parentNode.removeChild(scripts[0]);
                        const styles = body.getElementsByTagName('style');
                        while (styles[0]) styles[0].parentNode.removeChild(styles[0]);
                        
                        window.parent.postMessage({
                            type: 'FULL_TEXT_CONTENT',
                            text: body.innerText || body.textContent
                        }, '*');
                    } else if (event.data.type === 'GET_TEXT_FOR_ANALYSIS') {
                        // Extract a substantial chunk for analysis (up to 10000 chars)
                        const body = document.body.cloneNode(true);
                        const scripts = body.getElementsByTagName('script');
                        while (scripts[0]) scripts[0].parentNode.removeChild(scripts[0]);
                        const styles = body.getElementsByTagName('style');
                        while (styles[0]) styles[0].parentNode.removeChild(styles[0]);
                        
                        const fullText = body.innerText || body.textContent;
                        const snippet = fullText.slice(0, 10000); // Get first 10k chars for representative analysis
                        
                        window.parent.postMessage({
                            type: 'TEXT_FOR_ANALYSIS_CONTENT',
                            text: snippet
                        }, '*');
                    } else if (event.data.type === 'SET_HIGHLIGHT') {
                        const { charIndex, length } = event.data;

                        // Remove old highlight first
                        const removeHighlight = () => {
                            const old = document.querySelector('.read-highlight');
                            if (old) {
                                const parent = old.parentNode;
                                if (parent) {
                                    while (old.firstChild) parent.insertBefore(old.firstChild, old);
                                    parent.removeChild(old);
                                    parent.normalize();
                                }
                            }
                        };

                        if (charIndex === -1) { removeHighlight(); return; }

                        removeHighlight();

                        const range = document.createRange();
                        let currentOffset = 0;
                        let startNode, startOffset, endNode, endOffset;

                        // Traverse only visible text nodes, skipping script/style (same as innerText)
                        function traverse(node) {
                            const tag = node.nodeName.toUpperCase();
                            if (tag === 'SCRIPT' || tag === 'STYLE' || tag === 'NOSCRIPT') return false;
                            if (node.nodeType === 3) { // Text node
                                const nextOffset = currentOffset + node.length;
                                if (!startNode && charIndex >= currentOffset && charIndex < nextOffset) {
                                    startNode = node;
                                    startOffset = charIndex - currentOffset;
                                }
                                if (startNode && (charIndex + length) <= nextOffset) {
                                    endNode = node;
                                    endOffset = (charIndex + length) - currentOffset;
                                    return true;
                                }
                                currentOffset = nextOffset;
                            } else {
                                for (let i = 0; i < node.childNodes.length; i++) {
                                    if (traverse(node.childNodes[i])) return true;
                                }
                            }
                            return false;
                        }

                        traverse(document.body);

                        if (startNode && endNode) {
                            try {
                                range.setStart(startNode, startOffset);
                                range.setEnd(endNode, endOffset);

                                const span = document.createElement('span');
                                span.className = 'read-highlight';
                                span.style.cssText = 'background:#facc15;color:#000;border-radius:2px;padding:0 1px;';
                                range.surroundContents(span);
                                span.scrollIntoView({ behavior: 'smooth', block: 'center' });
                            } catch(e) {
                                // Range spans multiple nodes — skip highlight for this word
                            }
                        }
                    }
                });
            </script>
        `;
        // Case-insensitive injection before </body> — Gutenberg HTML varies in casing
        if (/<\/body>/i.test(html)) {
            html = html.replace(/<\/body>/i, `${selectionScript}</body>`);
        } else {
            // No </body> tag found — just append the script at the end
            html += selectionScript;
        }

        res.setHeader("Content-Type", "text/html");
        res.status(200).send(html);
    } catch (error) {
        return next(new ErrorHandler("Error fetching book content from Gutenberg.", 500));
    }
});

// Get User's All Digital Borrows (Active & Expired)
export const getMyDigitalBorrows = catchAsyncErrors(async (req, res, next) => {
    const userId = req.user._id;

    // Auto-update expired borrows to "Returned"
    const now = new Date();
    await DigitalBorrow.updateMany(
        {
            "user.id": userId,
            returned: false,
            expiryDate: { $lte: now }
        },
        {
            $set: {
                returned: true,
                returnDate: now,
                status: "Expired"
            }
        }
    );

    const borrows = await DigitalBorrow.find({
        "user.id": userId,
    }).populate("book");

    // Filter out borrows where the book has been deleted (book is null after population)
    const validBorrows = borrows.filter(b => b.book !== null);

    res.status(200).json({
        success: true,
        borrows: validBorrows,
    });
});

// Return Digital Book
export const returnDigitalBook = catchAsyncErrors(async (req, res, next) => {
    const { id } = req.params;

    const borrow = await DigitalBorrow.findById(id);

    if (!borrow) {
        return next(new ErrorHandler("Borrow record not found", 404));
    }

    if (borrow.user.id.toString() !== req.user._id.toString()) {
        return next(new ErrorHandler("You are not authorized to return this book", 403));
    }

    if (borrow.returned) {
        return next(new ErrorHandler("This book is already returned", 400));
    }

    borrow.returned = true;
    borrow.returnDate = new Date();
    borrow.status = "Expired"; // Setting to Expired so it's treated as inactive

    await borrow.save();

    res.status(200).json({
        success: true,
        message: "Digital book returned successfully",
    });
});

// Get All Digital Borrows (Admin)
export const getAllDigitalBorrows = catchAsyncErrors(async (req, res, next) => {
    const borrows = await DigitalBorrow.find().populate("book");

    // Filter out borrows where the book has been deleted
    const validBorrows = borrows.filter(b => b.book !== null);

    res.status(200).json({
        success: true,
        borrows: validBorrows,
    });
});
