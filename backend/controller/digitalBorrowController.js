import { catchAsyncErrors } from "../middlewares/catchAsyncErrors.js";
import ErrorHandler from "../middlewares/errorMiddlewares.js";
import { DigitalBook } from "../models/digitalBookModel.js";
import { DigitalBorrow } from "../models/digitalBorrowModel.js";
import { digitalBorrowSchema } from "../utils/validationSchema.js";

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
        const response = await fetch(book.htmlLink);
        if (!response.ok) {
            throw new Error(`Failed to fetch Gutenberg content: ${response.statusText}`);
        }
        let html = await response.text();

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
                        if (charIndex === -1) {
                            const old = document.querySelector('.ai-highlight');
                            if (old) old.outerHTML = old.innerHTML;
                            return;
                        }

                        // Simple highlighting strategy: find node by offset
                        // This is a complex task for cross-node text, but for simple books:
                        const selection = window.getSelection();
                        const range = document.createRange();
                        let currentOffset = 0;
                        let startNode, startOffset, endNode, endOffset;

                        function traverse(node) {
                            if (node.nodeType === 3) { // Text node
                                const nextOffset = currentOffset + node.length;
                                if (!startNode && charIndex >= currentOffset && charIndex < nextOffset) {
                                    startNode = node;
                                    startOffset = charIndex - currentOffset;
                                }
                                if (startNode && charIndex + length <= nextOffset) {
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
                            range.setStart(startNode, startOffset);
                            range.setEnd(endNode, endOffset);
                            
                            // Remove old highlight
                            const old = document.querySelector('.ai-highlight');
                            if (old) {
                                const parent = old.parentNode;
                                while(old.firstChild) parent.insertBefore(old.firstChild, old);
                                parent.removeChild(old);
                                parent.normalize();
                            }

                            const span = document.createElement('span');
                            span.className = 'ai-highlight';
                            span.style.backgroundColor = '#fef08a';
                            span.style.color = '#000';
                            span.style.transition = 'background-color 0.2s';
                            range.surroundContents(span);
                            span.scrollIntoView({ behavior: 'smooth', block: 'center' });
                        }
                    }
                });
            </script>
        `;
        html = html.replace('</body>', `${selectionScript}</body>`);

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

    res.status(200).json({
        success: true,
        borrows,
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
    res.status(200).json({
        success: true,
        borrows,
    });
});
