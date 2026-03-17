import z from "zod";

export const authResponseSchema = z.object({
    token: z.string().min(1, { message: "Token cannot be empty" }),
    user: z.object({
        id: z.number().positive({ message: "User ID must be a positive number" }),
        name: z.string().min(2, { message: "Name must be at least 2 characters long" }),
        email: z.email(),
        enabled: z.boolean(),
        provider: z.string(),
        avatarUrl: z.url(),
        createdAt: z.string().refine((date) => !isNaN(Date.parse(date)), { message: "Invalid date format" }),
    }),
});

