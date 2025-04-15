import { Request, Response, NextFunction } from "express";
import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

const prisma = new PrismaClient();

export const loginHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, password } = req.body;

  try {
    const user = await prisma.user.findUnique({
      where: { email },
    });

    if (!user) {
      res.status(400).json({ error: "Invalid email or password." });
      return;
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      res.status(400).json({ error: "Invalid email or password." });
      return;
    }

    const token = jwt.sign(
      {
        id: user.id,
        email: user.email,
        role: user.role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    res.json({ token });
  } catch (error) {
    console.error("Login error:", error);
    next(error);
  }
};

/**
 * POST /register
 * Registers a new user.
 * Expects email, password, and confirmPassword in the request body.
 */
export const registerHandler = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const { email, password, confirmPassword } = req.body;

  try {
    // Check if password and confirmPassword match.
    if (password !== confirmPassword) {
      res.status(400).json({ error: "Passwords do not match." });
      return;
    }

    // Check if a user with the provided email already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res.status(400).json({ error: "A user with that email already exists." });
      return;
    }

    // Hash the password for security
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user in the database. You can use a default role USER
    const newUser = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        role: "USER",
      },
    });

    // Optionally, generate a JWT upon registration
    const token = jwt.sign(
      {
        id: newUser.id,
        email: newUser.email,
        role: newUser.role,
      },
      process.env.JWT_SECRET as string,
      { expiresIn: "1h" }
    );

    res
      .status(201)
      .json({
        token,
        user: { id: newUser.id, email: newUser.email, role: newUser.role },
      });
  } catch (error) {
    console.error("Registration error:", error);
    next(error);
  }
};
