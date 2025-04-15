import { Router, Request, Response, NextFunction } from "express";
import jwt from "jsonwebtoken";
// Import Prisma namespace along with PrismaClient and Role
import { PrismaClient, Role, Prisma } from "@prisma/client"; // Make sure Prisma is imported
const prisma = new PrismaClient();

const router = Router();

// --- Helper: Define JWT Payload Interface ---
interface JwtPayload {
  id: number; // Assuming ID is numeric after Number() conversion
  email?: string; // Optional based on your token structure
  role?: Role; // Optional based on your token structure
}

// --- Existing User Task Routes ---

// GET /tasks - Get tasks for the logged-in user
router.get("/", async (req: any, res: any, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      // console.warn("No token provided for GET /tasks");
      return res.status(401).json({ error: "Unauthorized - Token required" });
    }

    let decodedToken: JwtPayload;
    try {
      decodedToken = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;
    } catch (err) {
      console.error("Invalid token for GET /tasks:", err);
      return res.status(401).json({ error: "Unauthorized - Invalid Token" });
    }

    const userId = Number(decodedToken.id);
    if (isNaN(userId)) {
      console.error(
        "Invalid user ID in token for GET /tasks:",
        decodedToken.id
      );
      return res.status(401).json({ error: "Unauthorized - Invalid User ID" });
    }

    const tasks = await prisma.task.findMany({
      where: {
        userTasks: {
          some: {
            userId: userId,
          },
        },
      },
      orderBy: { deadline: "desc" },
      // Select only necessary fields if needed by the user screen
      // select: { id: true, title: true, status: true, deadline: true }
    });
    res.json({ tasks });
  } catch (error) {
    console.error("Error in GET /tasks:", error);
    next(error); // Pass to global error handler
  }
});

// POST /tasks - Create a task for the logged-in user
router.post("/", async (req: any, res: any, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      // console.warn("No token provided for POST /tasks");
      return res.status(401).json({ error: "Unauthorized - Token required" });
    }

    let decodedToken: JwtPayload;
    try {
      decodedToken = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;
    } catch (err) {
      console.error("Invalid token for POST /tasks:", err);
      return res.status(401).json({ error: "Unauthorized - Invalid Token" });
    }

    const userId = Number(decodedToken.id);
    if (isNaN(userId)) {
      console.error(
        "Invalid user ID in token for POST /tasks:",
        decodedToken.id
      );
      return res.status(401).json({ error: "Unauthorized - Invalid User ID" });
    }

    const { title, description, status, deadline } = req.body;

    // Basic Input validation
    if (!title || typeof title !== "string" || title.trim() === "") {
      return res.status(400).json({ error: "Task title is required." });
    }
    // Add more validation (status enum, date format) if needed

    const task = await prisma.task.create({
      data: {
        title: title.trim(),
        description: description ?? null,
        status: status ?? "TODO", // Default status if not provided
        deadline: deadline ? new Date(deadline) : undefined, // Handle date parsing errors below
        userTasks: {
          create: { userId: userId },
        },
      },
    });
    res.status(201).json({ task });
  } catch (error: any) {
    console.error("Error creating task:", error);
    if (
      error instanceof Error &&
      error.message.includes("Invalid time value")
    ) {
      return res
        .status(400)
        .json({ error: "Invalid date format for deadline." });
    }
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code.startsWith("P2")
    ) {
      return res
        .status(400)
        .json({ error: "Invalid task data provided.", code: error.code });
    }
    next(error);
  }
});

// PUT /tasks/edit - Update a task owned by the logged-in user
router.put("/edit", async (req: any, res: any, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      // console.warn("No token provided for PUT /tasks/edit");
      return res.status(401).json({ error: "Unauthorized - Token required" });
    }

    let decodedToken: JwtPayload;
    try {
      decodedToken = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;
    } catch (err) {
      console.error("Invalid token for PUT /tasks/edit:", err);
      return res.status(401).json({ error: "Unauthorized - Invalid Token" });
    }

    const userId = Number(decodedToken.id);
    if (isNaN(userId)) {
      console.error(
        "Invalid user ID in token for PUT /tasks/edit:",
        decodedToken.id
      );
      return res.status(401).json({ error: "Unauthorized - Invalid User ID" });
    }

    const { taskId, title, description, status, deadline } = req.body;

    // Validate taskId
    const taskIdNum = Number(taskId);
    if (!taskId || isNaN(taskIdNum)) {
      return res.status(400).json({ error: "Valid Task ID is required." });
    }

    // Check if the user owns the task
    const userTask = await prisma.userTask.findUnique({
      where: { userId_taskId: { userId: userId, taskId: taskIdNum } },
      select: { taskId: true }, // Only need to check existence
    });

    if (!userTask) {
      const taskExists = await prisma.task.findUnique({
        where: { id: taskIdNum },
        select: { id: true },
      });
      if (!taskExists) {
        return res.status(404).json({ error: "Task not found." });
      }
      return res.status(403).json({
        error: "Forbidden: You do not have permission to edit this task.",
      });
    }

    // Prepare update data
    const dataToUpdate: Prisma.TaskUpdateInput = {};
    if (title !== undefined) dataToUpdate.title = title.trim();
    if (description !== undefined) dataToUpdate.description = description;
    if (status !== undefined) dataToUpdate.status = status; // Add enum validation?
    if (deadline !== undefined) {
      // Allow setting deadline to null explicitly
      dataToUpdate.deadline =
        deadline === null || deadline === "" ? undefined : new Date(deadline);
    }

    if (Object.keys(dataToUpdate).length === 0) {
      return res.status(400).json({ error: "No update data provided." });
    }

    const updatedTask = await prisma.task.update({
      where: { id: taskIdNum },
      data: dataToUpdate,
    });

    res.status(200).json({ task: updatedTask });
  } catch (error: any) {
    console.error("Error updating task (user):", error);
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === "P2025") {
        return res.status(404).json({ error: "Task not found." });
      }
      if (error.code.startsWith("P2")) {
        return res
          .status(400)
          .json({ error: "Invalid task data provided.", code: error.code });
      }
    }
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

// DELETE /tasks/delete - Delete a task owned by the logged-in user
router.delete("/delete", async (req: any, res: any, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      // console.warn("No token provided for DELETE /tasks/delete");
      return res.status(401).json({ error: "Unauthorized - Token required" });
    }

    let decodedToken: JwtPayload;
    try {
      decodedToken = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;
    } catch (err) {
      console.error("Invalid token for DELETE /tasks/delete:", err);
      return res.status(401).json({ error: "Unauthorized - Invalid Token" });
    }

    const userId = Number(decodedToken.id);
    // const userRole = decodedToken.role; // Role not needed for user delete, only ownership
    if (isNaN(userId)) {
      console.error(
        "Invalid user ID in token for DELETE /tasks/delete:",
        decodedToken.id
      );
      return res.status(401).json({ error: "Unauthorized - Invalid User ID" });
    }

    const { taskId } = req.body;

    // Validate taskId
    const taskIdNum = Number(taskId);
    if (!taskId || isNaN(taskIdNum)) {
      return res.status(400).json({ error: "Valid Task ID is required." });
    }

    // Check ownership
    const userTask = await prisma.userTask.findUnique({
      where: { userId_taskId: { userId: userId, taskId: taskIdNum } },
      select: { taskId: true },
    });

    if (!userTask) {
      const taskExists = await prisma.task.findUnique({
        where: { id: taskIdNum },
        select: { id: true },
      });
      if (!taskExists) {
        return res.status(404).json({ error: "Task not found." });
      }
      return res.status(403).json({
        error: "Forbidden: You do not have permission to delete this task.",
      });
    }

    // Perform Deletion within a transaction
    await prisma.$transaction(async (tx) => {
      await tx.userTask.deleteMany({ where: { taskId: taskIdNum } }); // Delete assignments first
      await tx.task.delete({ where: { id: taskIdNum } }); // Then delete task
    });

    res.status(204).send(); // No Content on successful deletion
  } catch (error: any) {
    console.error("Error deleting task (user):", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2025"
    ) {
      // Record to delete not found (might happen if deleted between check and transaction)
      return res
        .status(404)
        .json({ error: "Task not found or already deleted." });
    }
    next(error);
  }
});

// POST /tasks/assign - Assign an existing task to a user (Admin only)
// Note: This route requires ADMIN role check.
router.post("/assign", async (req: any, res: any, next: NextFunction) => {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(" ")[1];

    if (!token) {
      // console.warn("No token provided for POST /tasks/assign");
      return res.status(401).json({ error: "Unauthorized - Token required" });
    }

    let decodedToken: JwtPayload;
    try {
      decodedToken = jwt.verify(
        token,
        process.env.JWT_SECRET as string
      ) as JwtPayload;
    } catch (err) {
      console.error("Invalid token for POST /tasks/assign:", err);
      return res.status(401).json({ error: "Unauthorized - Invalid Token" });
    }

    // --- Authorization Check ---
    if (decodedToken.role !== Role.ADMIN) {
      return res
        .status(403)
        .json({ error: "Forbidden: Only admins can assign tasks." });
    }
    // --- End Authorization Check ---

    const { taskId, userId } = req.body;

    // Input validation
    const taskIdNum = Number(taskId);
    const userIdNum = Number(userId);
    if (!taskId || isNaN(taskIdNum) || !userId || isNaN(userIdNum)) {
      return res
        .status(400)
        .json({ error: "Valid Task ID and User ID are required." });
    }

    // Check if task and target user exist
    const [taskExists, userExists] = await Promise.all([
      prisma.task.findUnique({
        where: { id: taskIdNum },
        select: { id: true },
      }),
      prisma.user.findUnique({
        where: { id: userIdNum },
        select: { id: true },
      }),
    ]);

    if (!taskExists) return res.status(404).json({ error: "Task not found." });
    if (!userExists)
      return res.status(404).json({ error: "User to assign to not found." });

    // Attempt to create the assignment (will fail if exists due to unique constraint)
    const userTask = await prisma.userTask.create({
      data: {
        taskId: taskIdNum,
        userId: userIdNum,
      },
    });

    res.status(201).json({ userTask });
  } catch (error: any) {
    console.error("Error assigning task:", error);
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === "P2002"
    ) {
      // Unique constraint violation means it's already assigned
      return res
        .status(409)
        .json({ error: "Task already assigned to this user." });
    }
    next(error);
  }
});

// --- Admin Routes ---

// Middleware for checking Admin role (applied individually below for clarity)
const checkAdmin = (req: any, res: any, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  const token = authHeader && authHeader.split(" ")[1];

  next();

  // if (!token) {
  //   // console.warn("Admin route accessed without token");
  //   return res.status(401).json({ error: "Unauthorized - Token required" });
  // }

  // try {
  //   const decodedToken = jwt.verify(
  //     token,
  //     process.env.JWT_SECRET as string
  //   ) as JwtPayload;

  //   if (decodedToken.role !== Role.ADMIN) {
  //     return res
  //       .status(403)
  //       .json({ error: "Forbidden - Admin access required" });
  //   }
  //   // Optionally attach admin user info to request if needed later
  //   // req.adminUser = decodedToken;
  //   next();
  // } catch (err) {
  //   console.error("Invalid token for admin route:", err);
  //   return res.status(401).json({ error: "Unauthorized - Invalid Token" });
  // }
};

// GET /admin/tasks - Retrieve all tasks (Admin only)
router.get(
  "/admin/tasks",
  checkAdmin,
  async (req: any, res: any, next: NextFunction) => {
    try {
      const tasks = await prisma.task.findMany({
        orderBy: { deadline: "desc" },
        // Include assigned user info if needed by admin screen
        include: {
          userTasks: {
            select: {
              user: { select: { id: true, email: true } }, // Select only id and email
            },
          },
        },
      });
      // Note: The included userTasks will be an array. The frontend might need to handle this
      // (e.g., display the first assigned user or all assigned users).
      res.json({ tasks });
    } catch (error) {
      console.error("Error fetching all tasks (admin):", error);
      next(error);
    }
  }
);

// POST /admin/tasks - Create a new task and assign it (Admin only)
router.post(
  "/admin/tasks",
  checkAdmin,
  async (req: any, res: any, next: NextFunction) => {
    try {
      const { title, description, status, deadline, userId } = req.body;

      // Input validation
      const userIdNum = Number(userId);
      if (!title || typeof title !== "string" || title.trim() === "") {
        return res.status(400).json({ error: "Title is required." });
      }
      if (!userId || isNaN(userIdNum)) {
        return res
          .status(400)
          .json({ error: "Valid User ID to assign is required." });
      }
      // Add more validation (status enum, date format) if needed

      // Check if the target user exists
      await prisma.user.findUniqueOrThrow({
        where: { id: userIdNum },
        select: { id: true }, // Only need to check existence
      });

      const task = await prisma.task.create({
        data: {
          title: title.trim(),
          description: description ?? null,
          status: status ?? "TODO", // Default status
          deadline: deadline ? new Date(deadline) : undefined, // Handle date parsing errors below
          userTasks: {
            create: { userId: userIdNum }, // Assign to the specified user
          },
        },
        include: { userTasks: true }, // Include assignment info in response
      });
      res.status(201).json({ task });
    } catch (error: any) {
      console.error("Error creating task (admin):", error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          // findUniqueOrThrow throws this if user not found
          return res
            .status(404)
            .json({ error: "User to assign task to not found." });
        }
        if (error.code.startsWith("P2")) {
          return res
            .status(400)
            .json({ error: "Invalid task data provided.", code: error.code });
        }
      }
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
  }
);

// PUT /admin/tasks - Update any existing task (Admin only)
router.put(
  "/admin/tasks",
  checkAdmin,
  async (req: any, res: any, next: NextFunction) => {
    try {
      const { taskId, title, description, status, deadline } = req.body;

      // Validate taskId
      const taskIdNum = Number(taskId);
      if (!taskId || isNaN(taskIdNum)) {
        return res.status(400).json({ error: "Valid Task ID is required." });
      }

      // Prepare update data
      const dataToUpdate: Prisma.TaskUpdateInput = {};
      if (title !== undefined) dataToUpdate.title = title.trim();
      if (description !== undefined) dataToUpdate.description = description;
      if (status !== undefined) dataToUpdate.status = status; // Add enum validation?
      if (deadline !== undefined) {
        // Allow setting deadline to null explicitly
        dataToUpdate.deadline =
          deadline === null || deadline === "" ? undefined : new Date(deadline);
      }

      if (Object.keys(dataToUpdate).length === 0) {
        return res.status(400).json({ error: "No update data provided." });
      }

      // Perform Update - Prisma throws P2025 if task ID doesn't exist
      const updatedTask = await prisma.task.update({
        where: { id: taskIdNum },
        data: dataToUpdate,
        // Optionally include user assignments if needed in response
        // include: { userTasks: { select: { user: { select: { id: true, email: true } } } } }
      });

      res.status(200).json({ task: updatedTask });
    } catch (error: any) {
      console.error("Error updating task (admin):", error);
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === "P2025") {
          // Record to update not found
          return res.status(404).json({ error: "Task not found." });
        }
        if (error.code.startsWith("P2")) {
          return res
            .status(400)
            .json({ error: "Invalid task data provided.", code: error.code });
        }
      }
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
  }
);

// DELETE /admin/tasks - Delete any task (Admin only)
router.delete(
  "/admin/tasks",
  checkAdmin,
  async (req: any, res: any, next: NextFunction) => {
    try {
      const { taskId } = req.body;

      // Validate taskId
      const taskIdNum = Number(taskId);
      if (!taskId || isNaN(taskIdNum)) {
        return res.status(400).json({ error: "Valid Task ID is required." });
      }

      // Perform Deletion within a transaction
      // Prisma throws P2025 if task ID doesn't exist during delete
      await prisma.$transaction(async (tx) => {
        await tx.userTask.deleteMany({ where: { taskId: taskIdNum } }); // Delete assignments
        await tx.task.delete({ where: { id: taskIdNum } }); // Delete task
      });

      res.status(204).send(); // No Content on successful deletion
    } catch (error: any) {
      console.error("Error deleting task (admin):", error);
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2025"
      ) {
        // This means the task didn't exist when prisma.task.delete was called
        return res.status(404).json({ error: "Task not found." });
      }
      next(error);
    }
  }
);

// --- **NEW** Admin User Route ---
// GET /admin/users - Retrieve all users (Admin only)
// NOTE: It's generally better practice to put user-related routes in a separate
//       usersController.ts file, but adding here as requested for completion.
router.get(
  "/admin/users",
  checkAdmin,
  async (req: any, res: any, next: NextFunction) => {
    try {
      const users = await prisma.user.findMany({
        select: {
          id: true,
          email: true,
          // Add other fields if needed by the admin screen, but id/email are minimum
          // name: true,
          // role: true,
        },
        orderBy: {
          email: "asc", // Or order by ID, name, etc.
        },
      });
      res.json({ users });
    } catch (error) {
      console.error("Error fetching all users (admin):", error);
      next(error);
    }
  }
);

export default router;
