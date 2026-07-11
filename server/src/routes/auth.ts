import { Router, Request, Response, NextFunction } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";
import { config } from "../config/env";
import { authMiddleware, AuthenticatedRequest } from "../middleware/authMiddleware";
import { logger } from "../utils/logger";

export const authRouter = Router();

const SignupSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(6, "Password must be at least 6 characters"),
  name: z.string().min(2, "Name must be at least 2 characters").optional(),
});

const LoginSchema = z.object({
  email: z.string().email("Invalid email address").trim().toLowerCase(),
  password: z.string().min(1, "Password is required"),
});

// Helper to generate JWT token
function generateToken(user: { id: string; email: string; name?: string | null }): string {
  return jwt.sign(
    { id: user.id, email: user.email, name: user.name },
    config.jwtSecret,
    { expiresIn: "7d" }
  );
}

// POST /api/auth/signup - Register a new user
authRouter.post(
  "/auth/signup",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = SignupSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: "Validation failed",
          details: parseResult.error.errors.map((e) => e.message),
        });
        return;
      }

      const { email, password, name } = parseResult.data;

      // Check if user already exists
      const existingUser = await prisma.user.findUnique({
        where: { email },
      });

      if (existingUser) {
        res.status(409).json({ error: "Email is already registered" });
        return;
      }

      // Hash the password
      const salt = await bcrypt.genSalt(10);
      const passwordHash = await bcrypt.hash(password, salt);

      // Create new user in PostgreSQL
      const user = await prisma.user.create({
        data: {
          email,
          passwordHash,
          name: name || null,
        },
      });

      logger.info(`User registered successfully: ${user.email} (id: ${user.id})`);

      const token = generateToken(user);

      res.status(201).json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (err) {
      logger.error("Signup failed", { err });
      next(err);
    }
  }
);

// POST /api/auth/login - Log in an existing user
authRouter.post(
  "/auth/login",
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const parseResult = LoginSchema.safeParse(req.body);
      if (!parseResult.success) {
        res.status(400).json({
          error: "Validation failed",
          details: parseResult.error.errors.map((e) => e.message),
        });
        return;
      }

      const { email, password } = parseResult.data;

      // Find user
      const user = await prisma.user.findUnique({
        where: { email },
      });

      if (!user) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      // Check password
      const isMatch = await bcrypt.compare(password, user.passwordHash);
      if (!isMatch) {
        res.status(401).json({ error: "Invalid email or password" });
        return;
      }

      logger.info(`User logged in successfully: ${user.email}`);

      const token = generateToken(user);

      res.json({
        token,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (err) {
      logger.error("Login failed", { err });
      next(err);
    }
  }
);

// GET /api/auth/me - Get current user profile
authRouter.get(
  "/auth/me",
  authMiddleware,
  async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const authReq = req as AuthenticatedRequest;
      if (!authReq.user) {
        res.status(401).json({ error: "Unauthorized" });
        return;
      }

      const user = await prisma.user.findUnique({
        where: { id: authReq.user.id },
      });

      if (!user) {
        res.status(404).json({ error: "User not found" });
        return;
      }

      res.json({
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
      });
    } catch (err) {
      next(err);
    }
  }
);

// POST /api/auth/logout - Clear session indicator
authRouter.post("/auth/logout", (_req: Request, res: Response): void => {
  res.json({ success: true, message: "Logged out successfully" });
});
