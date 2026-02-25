import { z } from "zod";

export const digitalBorrowSchema = z.object({
    id: z.string().min(24, "Invalid book ID format").max(24, "Invalid book ID format"),
});

export const digitalImportSchema = z.object({
    gutenbergId: z.number(),
    title: z.string().min(1, "Title is required"),
    author: z.string().min(1, "Author is required"),
    htmlLink: z.string().url("Invalid HTML link"),
    borrowLimitDays: z.coerce.number().optional().default(0),
    borrowLimitHours: z.coerce.number().optional().default(0),
    borrowLimitMinutes: z.coerce.number().optional().default(0),
});
