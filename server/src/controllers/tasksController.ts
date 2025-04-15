import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
// Import Prisma namespace along with PrismaClient and Role
import { PrismaClient, Role, Prisma } from "@prisma/client"; // <-- Add Prisma here
const prisma = new PrismaClient();

const router = Router();

// --- Existing User Task Routes ---
// GET /tasks
router.get("/", async (req: any, res: any, next: NextFunction) => {
  // ... existing code ...
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log("No authorization header provided");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ error: "Unauthorized" });
    }

    let decodedToken;
    try {
      // Define a more specific type for the decoded token payload
      interface JwtPayload {
        id: number; // Assuming ID is numeric after Number() conversion
        email?: string; // Optional based on your token structure
        role?: Role; // Optional based on your token structure
      }
      // Use the interface for type assertion
      decodedToken = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;
    } catch (err) {
      console.log("Invalid token");
      // Handle specific JWT errors if needed (e.g., TokenExpiredError)
      return res.status(401).json({ error: "Unauthorized - Invalid Token" });
    }
    // Ensure ID is treated as a number consistently
    const userId = Number(decodedToken.id);
    if (isNaN(userId)) {
      console.log("Invalid user ID in token");
      return res.status(401).json({ error: "Unauthorized - Invalid User ID" });
    }

    // Remove or comment out debug logs if not needed
    // const printAllTasks = await prisma.task.findMany();
    // console.log("all tasks: ", printAllTasks);
    // const printAllUserTasks = await prisma.userTask.findMany();
    // console.log("all userTasks: ", printAllUserTasks);
    // const printAllUsers = await prisma.user.findMany();
    // console.log("all users ", printAllUsers);

    const tasks = await prisma.task.findMany({
      where: {
        userTasks: {
          some: {
            userId: userId,
          },
        },
      },
      orderBy: { deadline: "desc" },
      // Consider selecting only necessary fields if not all are needed
      // select: { id: true, title: true, status: true, deadline: true }
    });
    // console.log(userId); // Consider removing if not needed for debugging
    res.json({ tasks });
  } catch (error) {
    console.log("Error in get tasks");
    console.error(error); // Use console.error for errors
    next(error);
  }
});

// POST /tasks
router.post("/", async (req: any, res: any, next: NextFunction) => {
  // ... existing code ...
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log("No authorization header provided");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ error: "Unauthorized" });
    }

    let decodedToken;
    try {
      // Define a more specific type for the decoded token payload
      interface JwtPayload {
        id: number; // Assuming ID is numeric after Number() conversion
      }
      decodedToken = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;
    } catch (err) {
      console.log("Invalid token");
      return res.status(401).json({ error: "Unauthorized - Invalid Token" });
    }
    const userId = Number(decodedToken.id);
    if (isNaN(userId)) {
      console.log("Invalid user ID in token");
      return res.status(401).json({ error: "Unauthorized - Invalid User ID" });
    }

    const { title, description, status, deadline } = req.body;
    // Add input validation here (e.g., using a library like Zod or Joi)
    if (!title) {
      return res.status(400).json({ error: "Task title is required." });
    }
    // Add validation for status enum if applicable
    // Add validation for deadline format if applicable

    const task = await prisma.task.create({
      data: {
        title,
        description: description ?? null, // Explicitly handle potentially undefined description
        status, // Ensure this matches your TaskStatus enum
        deadline: deadline ? new Date(deadline) : undefined,
        userTasks: {
          create: { userId: userId },
        },
      },
      // Include userTasks in the response if needed by the client
      // include: { userTasks: true }
    });
    res.status(201).json({ task });
  } catch (error: any) {
    console.error("Error creating task:", error); // Use console.error
    // Handle potential errors during new Date(deadline)
    if (
      error instanceof Error &&
      error.message.includes("Invalid time value")
    ) {
      return res
        .status(400)
        .json({ error: "Invalid date format for deadline." });
    }
    // Handle potential Prisma validation errors if schema enforces constraints
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code.startsWith("P2")
    ) {
      console.error("Prisma Error Code:", error.code);
      // Provide a more generic error to the client for validation issues
      return res.status(400).json({ error: "Invalid task data provided." });
    }
    next(error);
  }
});

// DELETE /tasks/delete (Consider changing to DELETE /tasks/:taskId for RESTful practice)
// Suggestion: Change route to DELETE /tasks/:taskId
router.delete("/delete", async (req: any, res: any, next: NextFunction) => {
  // ... existing code ...
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log("No authorization header provided");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ error: "Unauthorized" });
    }

    let decodedToken;
    try {
      interface JwtPayload {
        id: number;
        role: Role;
      }
      decodedToken = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;
    } catch (err) {
      console.log("Invalid token");
      return res.status(401).json({ error: "Unauthorized - Invalid Token" });
    }
    const userId = Number(decodedToken.id);
    const userRole = decodedToken.role;
    if (isNaN(userId)) {
      console.log("Invalid user ID in token");
      return res.status(401).json({ error: "Unauthorized - Invalid User ID" });
    }

    // Prefer getting taskId from URL params (e.g., /tasks/:taskId)
    // const taskIdParam = req.params.taskId;
    const { taskId } = req.body; // Keep if you prefer body

    // Validate taskId (ensure it's a number if coming from body)
    const taskIdNum = Number(taskId);
    if (!taskId || isNaN(taskIdNum)) {
      return res.status(400).json({ error: "Valid Task ID is required." });
    }

    // Check if the task exists first (good practice)
    const taskExists = await prisma.task.findUnique({
      where: { id: taskIdNum },
    });
    if (!taskExists) {
      // Return 404 even if the user doesn't own it, prevents information leakage
      return res.status(404).json({ error: "Task not found." });
    }

    // Check if the user is an admin or owns the task
    if (userRole !== "ADMIN") {
      const userTask = await prisma.userTask.findFirst({
        where: {
          userId: userId,
          taskId: taskIdNum,
        },
      });

      if (!userTask) {
        // User is not admin and doesn't own the task
        return res
          .status(403)
          .json({
            error: "Forbidden: You do not have permission to delete this task.",
          });
      }
    }

    // Use a transaction for atomicity
    await prisma.$transaction(async (tx) => {
      // Delete the task from the UserTask table first due to potential foreign key constraints
      await tx.userTask.deleteMany({
        where: {
          taskId: taskIdNum,
        },
      });

      // Delete the task from the Task table
      await tx.task.delete({
        where: {
          id: taskIdNum,
        },
      });
    });

    // Send 204 No Content for successful deletions is common practice
    res.status(204).send();
    // Or keep 200 with message if preferred:
    // res.status(200).json({ message: "Task deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting task:", error); // Use console.error
    // Handle potential Prisma errors (e.g., record not found during the transaction)
    // P2025 might occur if the task was deleted between the check and the transaction
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      return res
        .status(404)
        .json({ error: "Task not found or already deleted." });
    }
    next(error);
  }
});

// PUT /tasks/edit (Consider changing to PUT /tasks/:taskId for RESTful practice)
// Suggestion: Change route to PUT /tasks/:taskId
router.put("/edit", async (req: any, res: any, next: NextFunction) => {
  // ... existing code ...
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log("No authorization header provided");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ error: "Unauthorized" });
    }

    let decodedToken;
    try {
      interface JwtPayload {
        id: number;
        // role?: Role; // Include if needed for authorization
      }
      decodedToken = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;
    } catch (err) {
      console.log("Invalid token");
      return res.status(401).json({ error: "Unauthorized - Invalid Token" });
    }
    const userId = Number(decodedToken.id);
    if (isNaN(userId)) {
      console.log("Invalid user ID in token");
      return res.status(401).json({ error: "Unauthorized - Invalid User ID" });
    }

    // Prefer getting taskId from URL params (e.g., /tasks/:taskId)
    // const taskIdParam = req.params.taskId;
    const { taskId, title, description, status, deadline } = req.body; // Keep if you prefer body

    // Validate taskId
    const taskIdNum = Number(taskId);
    if (!taskId || isNaN(taskIdNum)) {
      return res.status(400).json({ error: "Valid Task ID is required." });
    }
    // Add more input validation as needed (e.g., check status enum, deadline format)

    // Check if the user owns the task (non-admins shouldn't edit others' tasks via this route)
    const userTask = await prisma.userTask.findFirst({
      where: {
        userId: userId,
        taskId: taskIdNum,
      },
    });

    if (!userTask) {
      // Check if the task itself exists before returning 403 to avoid info leakage
      const taskExists = await prisma.task.findUnique({
        where: { id: taskIdNum },
      });
      if (!taskExists) {
        return res.status(404).json({ error: "Task not found." });
      }
      // Task exists, but user doesn't own it
      return res.status(403).json({
        error: "Forbidden: You do not have permission to edit this task.",
      });
    }

    // --- Reuse the explicit update logic from admin route for consistency ---
    const dataToUpdate: Prisma.TaskUpdateInput = {};
    if (title !== undefined) dataToUpdate.title = title;
    if (description !== undefined) dataToUpdate.description = description; // Handles null correctly if schema allows
    if (status !== undefined) dataToUpdate.status = status; // Validate enum?
    if (deadline !== undefined) {
      dataToUpdate.deadline =
        deadline === null || deadline === "" ? undefined : new Date(deadline);
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ error: "No update data provided." });
    }
    // --- End reuse ---

    const updatedTask = await prisma.task.update({
      where: { id: taskIdNum },
      data: dataToUpdate,
    });

    res.status(200).json({ task: updatedTask });
  } catch (error: any) {
    console.error("Error in edit task:", error); // Use console.error
    // Handle potential Prisma errors (e.g., record not found)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Task not found." });
      }
      console.error("Prisma Error Code:", error.code);
      // Handle validation errors
      if (error.code.startsWith("P2")) {
        return res.status(400).json({ error: "Invalid task data provided." });
      }
    }
    // Handle potential errors during new Date(deadline)
    if (
      error instanceof Error &&
      error.message.includes("Invalid time value")
    ) {
      return res
        .status(400)
        .json({ error: "Invalid date format for deadline." });
    }
    next(error);
  }
});

// POST /tasks/assign
router.post("/assign", async (req: any, res: any, next: NextFunction) => {
  // ... existing code ...
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log("No authorization header provided");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ error: "Unauthorized" });
    }

    let decodedToken;
    try {
      interface JwtPayload {
        id: number; // The assigning user's ID (admin)
        role: Role;
      }
      decodedToken = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;
    } catch (err) {
      console.log("Invalid token");
      return res.status(401).json({ error: "Unauthorized - Invalid Token" });
    }
    const userRole = decodedToken.role;
    // We don't strictly need the admin's ID here, but it's in the token

    // Only Admins can assign tasks
    if (userRole !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Forbidden: Only admins can assign tasks." });
    }

    const { taskId, userId } = req.body;

    // Input validation
    const taskIdNum = Number(taskId);
    const userIdNum = Number(userId);
    if (!taskId || isNaN(taskIdNum) || !userId || isNaN(userIdNum)) {
      return res
        .status(400)
        .json({ error: "Valid Task ID and User ID are required." });
    }

    // Check if task and target user exist (recommended)
    // Using findUniqueOrThrow can simplify if you want errors thrown directly
    const [taskExists, userExists] = await Promise.all([
      prisma.task.findUnique({ where: { id: taskIdNum } }),
      prisma.user.findUnique({ where: { id: userIdNum } }),
    ]);

    if (!taskExists) {
      return res.status(404).json({ error: "Task not found." });
    }
    if (!userExists) {
      return res.status(404).json({ error: "User to assign to not found." });
    }

    // Check if already assigned using findUnique for efficiency
    const existingUserTask = await prisma.userTask.findUnique({
      where: {
        userId_taskId: {
          // Use the compound unique index
          userId: userIdNum,
          taskId: taskIdNum,
        },
      },
    });

    if (existingUserTask) {
      return res
        .status(409) // 409 Conflict is appropriate
        .json({ error: "Task already assigned to this user" });
    }

    // Create the assignment
    const userTask = await prisma.userTask.create({
      data: {
        taskId: taskIdNum,
        userId: userIdNum,
      },
    });

    res.status(201).json({ userTask });
  } catch (error: any) {
    console.error("Error assigning task:", error); // Use console.error
    // Handle potential Prisma unique constraint errors (P2002)
    // This might happen in a race condition if the check above passes but creation fails
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      return res
        .status(409)
        .json({
          error: "Task already assigned to this user (constraint violation).",
        });
    }
    next(error);
  }
});

// --- Admin Task Routes ---

// GET /admin/tasks: Retrieve all tasks. Requires admin token.
router.get("/admin/tasks", async (req: any, res: any, next: NextFunction) => {
  // ... existing code ...
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log("No authorization header provided");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ error: "Unauthorized" });
    }

    let decodedToken;
    try {
      interface JwtPayload {
        id: number; // Admin's ID
        role: Role;
      }
      decodedToken = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;
    } catch (err) {
      console.log("Invalid token");
      return res.status(401).json({ error: "Unauthorized - Invalid Token" });
    }

    if (decodedToken.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Forbidden: Admin access required." });
    }

    const tasks = await prisma.task.findMany({
      orderBy: { deadline: "desc" },
      // Consider including user assignments if needed by the admin UI
      // include: {
      //   userTasks: {
      //     select: { // Select only necessary user fields
      //       user: { select: { id: true, email: true } }
      //     }
      //   }
      // }
    });
    res.json({ tasks });
  } catch (error) {
    console.error("Error in get all tasks (admin):", error); // Use console.error
    next(error);
  }
});

// POST /admin/tasks: Create a new task. Requires admin token.
router.post("/admin/tasks", async (req: any, res: any, next: NextFunction) => {
  // ... existing code ...
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log("No authorization header provided");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ error: "Unauthorized" });
    }

    let decodedToken;
    try {
      interface JwtPayload {
        id: number; // Admin's ID
        role: Role;
      }
      decodedToken = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;
    } catch (err) {
      console.log("Invalid token");
      return res.status(401).json({ error: "Unauthorized - Invalid Token" });
    }

    if (decodedToken.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Forbidden: Admin access required." });
    }

    const { title, description, status, deadline, userId } = req.body; // userId is the user to assign the task to

    // Input validation
    const userIdNum = Number(userId);
    if (!title) {
      return res.status(400).json({ error: "Title is required." });
    }
    if (!userId || isNaN(userIdNum)) {
      return res
        .status(400)
        .json({ error: "Valid User ID to assign is required." });
    }
    // Add more validation (status enum, date format etc.)

    // Check if the target user exists
    const userExists = await prisma.user.findUnique({
      where: { id: userIdNum },
    });
    if (!userExists) {
      return res
        .status(404) // Use 404 for the referenced user not found
        .json({ error: "User to assign task to not found." });
    }

    const task = await prisma.task.create({
      data: {
        title,
        description: description ?? null,
        status, // Ensure status is a valid enum value
        deadline: deadline ? new Date(deadline) : undefined,
        userTasks: {
          create: { userId: userIdNum }, // Assign to the specified user
        },
      },
      // Include userTasks in response if needed
      // include: { userTasks: true }
    });
    res.status(201).json({ task });
  } catch (error: any) {
    console.error("Error creating task (admin):", error); // Use console.error
    // Handle potential errors during new Date(deadline)
    if (
      error instanceof Error &&
      error.message.includes("Invalid time value")
    ) {
      return res
        .status(400)
        .json({ error: "Invalid date format for deadline." });
    }
    // Handle potential Prisma validation errors
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code.startsWith("P2")
    ) {
      console.error("Prisma Error Code:", error.code);
      return res.status(400).json({ error: "Invalid task data provided." });
    }
    next(error);
  }
});

// PUT /admin/tasks: Update an existing task. Requires admin token.
// Suggestion: Change route to PUT /admin/tasks/:taskId
router.put("/admin/tasks", async (req: any, res: any, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      console.log("No authorization header provided");
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];
    if (!token) {
      console.log("No token provided");
      return res.status(401).json({ error: "Unauthorized" });
    }

    let decodedToken;
    try {
      interface JwtPayload {
        id: number; // Admin's ID
        role: Role;
      }
      decodedToken = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;
    } catch (err) {
      console.log("Invalid token");
      return res.status(401).json({ error: "Unauthorized - Invalid Token" });
    }

    // Ensure the user is an admin
    if (decodedToken.role !== "ADMIN") {
      return res
        .status(403)
        .json({ error: "Forbidden: Admin access required." });
    }

    // Prefer getting taskId from URL params (e.g., /admin/tasks/:taskId)
    // const taskIdParam = req.params.taskId;
    const { taskId, title, description, status, deadline } = req.body; // Keep if you prefer body

    // Validate taskId
    const taskIdNum = Number(taskId);
    if (!taskId || isNaN(taskIdNum)) {
      return res.status(400).json({ error: "Valid Task ID is required." });
    }
    // Add more input validation as needed (e.g., status enum, date format)

    // Check if task exists before attempting update (optional but good practice)
    // Using findUniqueOrThrow could simplify if 404 is the desired outcome on not found
    const taskExists = await prisma.task.findUnique({
      where: { id: taskIdNum },
    });
    if (!taskExists) {
      return res.status(404).json({ error: "Task not found." });
    }

    // Explicitly construct the data object for the update
    const dataToUpdate: Prisma.TaskUpdateInput = {};

    // Only add fields to the update object if they were provided in the request
    if (title !== undefined) {
      dataToUpdate.title = title;
    }
    if (description !== undefined) {
      // Allow setting description to null if schema permits and that's the intent
      dataToUpdate.description = description;
    }
    if (status !== undefined) {
      // You might want to validate the status against your TaskStatus enum here
      dataToUpdate.status = status;
    }
    if (deadline !== undefined) {
      // Handle setting deadline: null or empty string clears it, otherwise parse the date string
      dataToUpdate.deadline =
        deadline === null || deadline === "" ? undefined : new Date(deadline);
    }

    // Ensure we are actually updating at least one field
    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ error: "No update data provided." });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskIdNum },
      data: dataToUpdate, // Use the explicitly constructed object
    });

    res.status(200).json({ task: updatedTask });
  } catch (error: any) {
    console.error("Error updating task (admin):", error); // Use console.error

    // Handle potential Prisma errors (e.g., record not found during update)
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        // This code means the record to update was not found
        return res.status(404).json({ error: "Task not found." });
      }
      // Handle other potential Prisma errors like validation errors if needed
      console.error("Prisma Error Code:", error.code);
      if (error.code.startsWith("P2")) {
        return res.status(400).json({ error: "Invalid task data provided." });
      }
    }
    // Handle potential errors during new Date(deadline) if the format is invalid
    if (
      error instanceof Error &&
      error.message.includes("Invalid time value")
    ) {
      return res
        .status(400)
        .json({ error: "Invalid date format for deadline." });
    }

    next(error);
  }
});

// DELETE /admin/tasks: Delete a task. Requires admin token.
// Suggestion: Change route to DELETE /admin/tasks/:taskId
router.delete(
  "/admin/tasks",
  async (req: any, res: any, next: NextFunction) => {
    // ... existing code ...
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        console.log("No authorization header provided");
        return res.status(401).json({ error: "Unauthorized" });
      }

      const token = authHeader.split(" ")[1];
      if (!token) {
        console.log("No token provided");
        return res.status(401).json({ error: "Unauthorized" });
      }

      let decodedToken;
      try {
        interface JwtPayload {
          // id is not strictly needed here, but role is
          role: Role;
        }
        decodedToken = jwt.verify(
          token,
          process.env.JWT_SECRET as string
        ) as JwtPayload;
      } catch (err) {
        console.log("Invalid token");
        return res.status(401).json({ error: "Unauthorized - Invalid Token" });
      }

      if (decodedToken.role !== "ADMIN") {
        return res
          .status(403)
          .json({ error: "Forbidden: Admin access required." });
      }

      // Prefer getting taskId from URL params (e.g., /admin/tasks/:taskId)
      // const taskIdParam = req.params.taskId;
      const { taskId } = req.body; // Keep if you prefer body

      // Validate taskId
      const taskIdNum = Number(taskId);
      if (!taskId || isNaN(taskIdNum)) {
        return res.status(400).json({ error: "Valid Task ID is required." });
      }

      // Check if task exists before attempting delete (good practice)
      const taskExists = await prisma.task.findUnique({
        where: { id: taskIdNum },
      });
      if (!taskExists) {
        return res.status(404).json({ error: "Task not found." });
      }

      // Use a transaction for atomicity when deleting related data
      await prisma.$transaction(async (tx) => {
        // First delete related UserTask entries
        await tx.userTask.deleteMany({
          where: { taskId: taskIdNum },
        });
        // Then delete the task itself
        await tx.task.delete({ where: { id: taskIdNum } });
      });

      // Send 204 No Content for successful deletions
      res.status(204).send();
      // Or keep 200 with message:
      // res.status(200).json({ message: "Task deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting task (admin):", error); // Use console.error
      // Handle potential Prisma errors (e.g., record not found during transaction)
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        // This might happen if the task is deleted between the check and the transaction
        return res
          .status(404)
          .json({ error: "Task not found or already deleted." });
      }
      next(error);
    }
  }
);

// --- Missing Admin User Routes ---
// These should likely go into a separate usersController.ts file

export default router;
