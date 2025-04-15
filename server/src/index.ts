import express, { Request, Response } from "express";
import cors from "cors";
import { PrismaClient } from "@prisma/client";
import { loginHandler, registerHandler } from "./controllers/authConroller";
import getTasksHandler from "./controllers/tasksController";

// Initialize Express and Prisma
const app = express();
const prisma = new PrismaClient();
const PORT = 1235;

app.use(cors());

// Middleware to parse JSON requests
app.use(express.json());

// A simple route for testing the server
app.get("/", (req: Request, res: Response) => {
  res.send("Task Management API is running!");
});

// Example endpoint to fetch all users with their tasks
app.get("/users", async (req: Request, res: Response) => {
  try {
    const users = await prisma.user.findMany({
      include: { tasks: { include: { task: true } } },
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ error: "An error occurred while fetching users." });
  }
});

//
//handlers
app.post("/login", loginHandler);
app.post("/register", registerHandler);
app.use("/tasks", getTasksHandler);

//
//

// Example endpoint to create a new task and assign it to one or more users
app.post("/tasks", async (req: Request, res: Response) => {
  const { title, description, status, assignedBy, userIds } = req.body;

  try {
    // Create the task
    const task = await prisma.task.create({
      data: {
        title,
        description,
        status, // Should match one of the TaskStatus enum values
        assignedBy,
      },
    });

    // Create entries in the join table for each assigned user
    await Promise.all(
      userIds.map((userId: number) => {
        return prisma.userTask.create({
          data: {
            userId,
            taskId: task.id,
          },
        });
      })
    );

    res.status(201).json({ task });
  } catch (error) {
    res
      .status(500)
      .json({ error: "An error occurred while creating the task." });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
