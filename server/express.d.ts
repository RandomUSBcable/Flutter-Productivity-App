import { Task, User } from "@prisma/client";

declare global {
  namespace Express {
    interface Request {
      user?: {
        id: number;
        email: string;
        role: string;
        // Add other properties that you attach to the request.user object if needed
      } | null;
    }
  }
}
