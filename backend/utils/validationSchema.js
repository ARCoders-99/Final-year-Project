import { z } from "zod";

export const registerSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters").max(30, "Name cannot exceed 30 characters"),
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters").max(16, "Password cannot exceed 16 characters"),
});

export const loginSchema = z.object({
    email: z.string().email("Invalid email format"),
    password: z.string().min(8, "Password must be at least 8 characters").max(16, "Password cannot exceed 16 characters"),
});

export const updateProfileSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters").max(30, "Name cannot exceed 30 characters").optional(),
    email: z.string().email("Invalid email format").optional(),
    oldPassword: z.string().min(8, "Old password must be at least 8 characters").max(16, "Old password cannot exceed 16 characters"),
    newPassword: z.string().min(8, "New password must be at least 8 characters").max(16, "New password cannot exceed 16 characters"),
}).refine(data => data.oldPassword !== data.newPassword, {
    message: "New password cannot be the same as the old password",
    path: ["newPassword"],
});

export const updatePasswordSchema = z.object({
    currentPassword: z.string().min(8, "Current password must be at least 8 characters"),
    newPassword: z.string().min(8, "New password must be at least 8 characters").max(16, "New password cannot exceed 16 characters"),
    confirmNewPassword: z.string().min(8, "Confirm new password must be at least 8 characters"),
}).refine(data => data.newPassword === data.confirmNewPassword, {
    message: "New passwords do not match",
    path: ["confirmNewPassword"],
}).refine(data => data.currentPassword !== data.newPassword, {
    message: "New password cannot be the same as the current password",
    path: ["newPassword"],
});

export const addNewAdminSchema = z.object({
    name: z.string().min(3, "Name must be at least 3 characters").max(30, "Name cannot exceed 30 characters"),
    email: z.string().email("Invalid email format"),
    phone: z.string().min(10, "Phone number must be at least 10 digits").max(15, "Phone number cannot exceed 15 digits"),
    password: z.string().min(8, "Password must be at least 8 characters").max(16, "Password cannot exceed 16 characters"),
});

export const addBookSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title cannot exceed 100 characters"),
    author: z.string().min(1, "Author is required").max(50, "Author cannot exceed 50 characters"),
    price: z.coerce.number().min(0, "Price cannot be negative"),
    borrowLimitDays: z.coerce.number().min(0).max(365).optional().default(0),
    borrowLimitHours: z.coerce.number().min(0).max(23).optional().default(0),
    borrowLimitMinutes: z.coerce.number().min(0).max(59).optional().default(0),
});

export const updateBookSchema = z.object({
    title: z.string().min(1, "Title is required").max(100, "Title cannot exceed 100 characters").optional(),
    author: z.string().min(1, "Author is required").max(50, "Author cannot exceed 50 characters").optional(),
    price: z.coerce.number().min(0, "Price cannot be negative").optional(),
    borrowLimitDays: z.coerce.number().min(0).max(365).optional(),
    borrowLimitHours: z.coerce.number().min(0).max(23).optional(),
    borrowLimitMinutes: z.coerce.number().min(0).max(59).optional(),
});

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
