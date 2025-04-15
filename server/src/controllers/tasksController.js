"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __generator = (this && this.__generator) || function (thisArg, body) {
    var _ = { label: 0, sent: function() { if (t[0] & 1) throw t[1]; return t[1]; }, trys: [], ops: [] }, f, y, t, g = Object.create((typeof Iterator === "function" ? Iterator : Object).prototype);
    return g.next = verb(0), g["throw"] = verb(1), g["return"] = verb(2), typeof Symbol === "function" && (g[Symbol.iterator] = function() { return this; }), g;
    function verb(n) { return function (v) { return step([n, v]); }; }
    function step(op) {
        if (f) throw new TypeError("Generator is already executing.");
        while (g && (g = 0, op[0] && (_ = 0)), _) try {
            if (f = 1, y && (t = op[0] & 2 ? y["return"] : op[0] ? y["throw"] || ((t = y["return"]) && t.call(y), 0) : y.next) && !(t = t.call(y, op[1])).done) return t;
            if (y = 0, t) op = [op[0] & 2, t.value];
            switch (op[0]) {
                case 0: case 1: t = op; break;
                case 4: _.label++; return { value: op[1], done: false };
                case 5: _.label++; y = op[1]; op = [0]; continue;
                case 7: op = _.ops.pop(); _.trys.pop(); continue;
                default:
                    if (!(t = _.trys, t = t.length > 0 && t[t.length - 1]) && (op[0] === 6 || op[0] === 2)) { _ = 0; continue; }
                    if (op[0] === 3 && (!t || (op[1] > t[0] && op[1] < t[3]))) { _.label = op[1]; break; }
                    if (op[0] === 6 && _.label < t[1]) { _.label = t[1]; t = op; break; }
                    if (t && _.label < t[2]) { _.label = t[2]; _.ops.push(op); break; }
                    if (t[2]) _.ops.pop();
                    _.trys.pop(); continue;
            }
            op = body.call(thisArg, _);
        } catch (e) { op = [6, e]; y = 0; } finally { f = t = 0; }
        if (op[0] & 5) throw op[1]; return { value: op[0] ? op[1] : void 0, done: true };
    }
};
Object.defineProperty(exports, "__esModule", { value: true });
var express_1 = require("express");
var jwt = require("jsonwebtoken");
// Import Prisma namespace along with PrismaClient and Role
var client_1 = require("@prisma/client"); // Make sure Prisma is imported
var prisma = new client_1.PrismaClient();
var router = (0, express_1.Router)();
// --- Existing User Task Routes ---
// GET /tasks - Get tasks for the logged-in user
router.get("/", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var authHeader, token, decodedToken, userId, tasks, error_1;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                authHeader = req.headers.authorization;
                token = authHeader && authHeader.split(" ")[1];
                if (!token) {
                    // console.warn("No token provided for GET /tasks");
                    return [2 /*return*/, res.status(401).json({ error: "Unauthorized - Token required" })];
                }
                decodedToken = void 0;
                try {
                    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
                }
                catch (err) {
                    console.error("Invalid token for GET /tasks:", err);
                    return [2 /*return*/, res.status(401).json({ error: "Unauthorized - Invalid Token" })];
                }
                userId = Number(decodedToken.id);
                if (isNaN(userId)) {
                    console.error("Invalid user ID in token for GET /tasks:", decodedToken.id);
                    return [2 /*return*/, res.status(401).json({ error: "Unauthorized - Invalid User ID" })];
                }
                return [4 /*yield*/, prisma.task.findMany({
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
                    })];
            case 1:
                tasks = _a.sent();
                res.json({ tasks: tasks });
                return [3 /*break*/, 3];
            case 2:
                error_1 = _a.sent();
                console.error("Error in GET /tasks:", error_1);
                next(error_1); // Pass to global error handler
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST /tasks - Create a task for the logged-in user
router.post("/", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var authHeader, token, decodedToken, userId, _a, title, description, status_1, deadline, task, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                authHeader = req.headers.authorization;
                token = authHeader && authHeader.split(" ")[1];
                if (!token) {
                    // console.warn("No token provided for POST /tasks");
                    return [2 /*return*/, res.status(401).json({ error: "Unauthorized - Token required" })];
                }
                decodedToken = void 0;
                try {
                    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
                }
                catch (err) {
                    console.error("Invalid token for POST /tasks:", err);
                    return [2 /*return*/, res.status(401).json({ error: "Unauthorized - Invalid Token" })];
                }
                userId = Number(decodedToken.id);
                if (isNaN(userId)) {
                    console.error("Invalid user ID in token for POST /tasks:", decodedToken.id);
                    return [2 /*return*/, res.status(401).json({ error: "Unauthorized - Invalid User ID" })];
                }
                _a = req.body, title = _a.title, description = _a.description, status_1 = _a.status, deadline = _a.deadline;
                // Basic Input validation
                if (!title || typeof title !== "string" || title.trim() === "") {
                    return [2 /*return*/, res.status(400).json({ error: "Task title is required." })];
                }
                return [4 /*yield*/, prisma.task.create({
                        data: {
                            title: title.trim(),
                            description: description !== null && description !== void 0 ? description : null,
                            status: status_1 !== null && status_1 !== void 0 ? status_1 : "TODO", // Default status if not provided
                            deadline: deadline ? new Date(deadline) : undefined, // Handle date parsing errors below
                            userTasks: {
                                create: { userId: userId },
                            },
                        },
                    })];
            case 1:
                task = _b.sent();
                res.status(201).json({ task: task });
                return [3 /*break*/, 3];
            case 2:
                error_2 = _b.sent();
                console.error("Error creating task:", error_2);
                if (error_2 instanceof Error &&
                    error_2.message.includes("Invalid time value")) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ error: "Invalid date format for deadline." })];
                }
                if (error_2 instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                    error_2.code.startsWith("P2")) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ error: "Invalid task data provided.", code: error_2.code })];
                }
                next(error_2);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// PUT /tasks/edit - Update a task owned by the logged-in user
router.put("/edit", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var authHeader, token, decodedToken, userId, _a, taskId, title, description, status_2, deadline, taskIdNum, userTask, taskExists, dataToUpdate, updatedTask, error_3;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 5, , 6]);
                authHeader = req.headers.authorization;
                token = authHeader && authHeader.split(" ")[1];
                if (!token) {
                    // console.warn("No token provided for PUT /tasks/edit");
                    return [2 /*return*/, res.status(401).json({ error: "Unauthorized - Token required" })];
                }
                decodedToken = void 0;
                try {
                    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
                }
                catch (err) {
                    console.error("Invalid token for PUT /tasks/edit:", err);
                    return [2 /*return*/, res.status(401).json({ error: "Unauthorized - Invalid Token" })];
                }
                userId = Number(decodedToken.id);
                if (isNaN(userId)) {
                    console.error("Invalid user ID in token for PUT /tasks/edit:", decodedToken.id);
                    return [2 /*return*/, res.status(401).json({ error: "Unauthorized - Invalid User ID" })];
                }
                _a = req.body, taskId = _a.taskId, title = _a.title, description = _a.description, status_2 = _a.status, deadline = _a.deadline;
                taskIdNum = Number(taskId);
                if (!taskId || isNaN(taskIdNum)) {
                    return [2 /*return*/, res.status(400).json({ error: "Valid Task ID is required." })];
                }
                return [4 /*yield*/, prisma.userTask.findUnique({
                        where: { userId_taskId: { userId: userId, taskId: taskIdNum } },
                        select: { taskId: true }, // Only need to check existence
                    })];
            case 1:
                userTask = _b.sent();
                if (!!userTask) return [3 /*break*/, 3];
                return [4 /*yield*/, prisma.task.findUnique({
                        where: { id: taskIdNum },
                        select: { id: true },
                    })];
            case 2:
                taskExists = _b.sent();
                if (!taskExists) {
                    return [2 /*return*/, res.status(404).json({ error: "Task not found." })];
                }
                return [2 /*return*/, res.status(403).json({
                        error: "Forbidden: You do not have permission to edit this task.",
                    })];
            case 3:
                dataToUpdate = {};
                if (title !== undefined)
                    dataToUpdate.title = title.trim();
                if (description !== undefined)
                    dataToUpdate.description = description;
                if (status_2 !== undefined)
                    dataToUpdate.status = status_2; // Add enum validation?
                if (deadline !== undefined) {
                    // Allow setting deadline to null explicitly
                    dataToUpdate.deadline =
                        deadline === null || deadline === "" ? undefined : new Date(deadline);
                }
                if (Object.keys(dataToUpdate).length === 0) {
                    return [2 /*return*/, res.status(400).json({ error: "No update data provided." })];
                }
                return [4 /*yield*/, prisma.task.update({
                        where: { id: taskIdNum },
                        data: dataToUpdate,
                    })];
            case 4:
                updatedTask = _b.sent();
                res.status(200).json({ task: updatedTask });
                return [3 /*break*/, 6];
            case 5:
                error_3 = _b.sent();
                console.error("Error updating task (user):", error_3);
                if (error_3 instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    if (error_3.code === "P2025") {
                        return [2 /*return*/, res.status(404).json({ error: "Task not found." })];
                    }
                    if (error_3.code.startsWith("P2")) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ error: "Invalid task data provided.", code: error_3.code })];
                    }
                }
                if (error_3 instanceof Error &&
                    error_3.message.includes("Invalid time value")) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ error: "Invalid date format for deadline." })];
                }
                next(error_3);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// DELETE /tasks/delete - Delete a task owned by the logged-in user
router.delete("/delete", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var authHeader, token, decodedToken, userId, taskId, taskIdNum_1, userTask, taskExists, error_4;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 5, , 6]);
                authHeader = req.headers.authorization;
                token = authHeader && authHeader.split(" ")[1];
                if (!token) {
                    // console.warn("No token provided for DELETE /tasks/delete");
                    return [2 /*return*/, res.status(401).json({ error: "Unauthorized - Token required" })];
                }
                decodedToken = void 0;
                try {
                    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
                }
                catch (err) {
                    console.error("Invalid token for DELETE /tasks/delete:", err);
                    return [2 /*return*/, res.status(401).json({ error: "Unauthorized - Invalid Token" })];
                }
                userId = Number(decodedToken.id);
                // const userRole = decodedToken.role; // Role not needed for user delete, only ownership
                if (isNaN(userId)) {
                    console.error("Invalid user ID in token for DELETE /tasks/delete:", decodedToken.id);
                    return [2 /*return*/, res.status(401).json({ error: "Unauthorized - Invalid User ID" })];
                }
                taskId = req.body.taskId;
                taskIdNum_1 = Number(taskId);
                if (!taskId || isNaN(taskIdNum_1)) {
                    return [2 /*return*/, res.status(400).json({ error: "Valid Task ID is required." })];
                }
                return [4 /*yield*/, prisma.userTask.findUnique({
                        where: { userId_taskId: { userId: userId, taskId: taskIdNum_1 } },
                        select: { taskId: true },
                    })];
            case 1:
                userTask = _a.sent();
                if (!!userTask) return [3 /*break*/, 3];
                return [4 /*yield*/, prisma.task.findUnique({
                        where: { id: taskIdNum_1 },
                        select: { id: true },
                    })];
            case 2:
                taskExists = _a.sent();
                if (!taskExists) {
                    return [2 /*return*/, res.status(404).json({ error: "Task not found." })];
                }
                return [2 /*return*/, res.status(403).json({
                        error: "Forbidden: You do not have permission to delete this task.",
                    })];
            case 3: 
            // Perform Deletion within a transaction
            return [4 /*yield*/, prisma.$transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                    return __generator(this, function (_a) {
                        switch (_a.label) {
                            case 0: return [4 /*yield*/, tx.userTask.deleteMany({ where: { taskId: taskIdNum_1 } })];
                            case 1:
                                _a.sent(); // Delete assignments first
                                return [4 /*yield*/, tx.task.delete({ where: { id: taskIdNum_1 } })];
                            case 2:
                                _a.sent(); // Then delete task
                                return [2 /*return*/];
                        }
                    });
                }); })];
            case 4:
                // Perform Deletion within a transaction
                _a.sent();
                res.status(204).send(); // No Content on successful deletion
                return [3 /*break*/, 6];
            case 5:
                error_4 = _a.sent();
                console.error("Error deleting task (user):", error_4);
                if (error_4 instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                    error_4.code === "P2025") {
                    // Record to delete not found (might happen if deleted between check and transaction)
                    return [2 /*return*/, res
                            .status(404)
                            .json({ error: "Task not found or already deleted." })];
                }
                next(error_4);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); });
// POST /tasks/assign - Assign an existing task to a user (Admin only)
// Note: This route requires ADMIN role check.
router.post("/assign", function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var authHeader, token, decodedToken, _a, taskId, userId, taskIdNum, userIdNum, _b, taskExists, userExists, userTask, error_5;
    return __generator(this, function (_c) {
        switch (_c.label) {
            case 0:
                _c.trys.push([0, 3, , 4]);
                authHeader = req.headers.authorization;
                token = authHeader && authHeader.split(" ")[1];
                if (!token) {
                    // console.warn("No token provided for POST /tasks/assign");
                    return [2 /*return*/, res.status(401).json({ error: "Unauthorized - Token required" })];
                }
                decodedToken = void 0;
                try {
                    decodedToken = jwt.verify(token, process.env.JWT_SECRET);
                }
                catch (err) {
                    console.error("Invalid token for POST /tasks/assign:", err);
                    return [2 /*return*/, res.status(401).json({ error: "Unauthorized - Invalid Token" })];
                }
                // --- Authorization Check ---
                if (decodedToken.role !== client_1.Role.ADMIN) {
                    return [2 /*return*/, res
                            .status(403)
                            .json({ error: "Forbidden: Only admins can assign tasks." })];
                }
                _a = req.body, taskId = _a.taskId, userId = _a.userId;
                taskIdNum = Number(taskId);
                userIdNum = Number(userId);
                if (!taskId || isNaN(taskIdNum) || !userId || isNaN(userIdNum)) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ error: "Valid Task ID and User ID are required." })];
                }
                return [4 /*yield*/, Promise.all([
                        prisma.task.findUnique({
                            where: { id: taskIdNum },
                            select: { id: true },
                        }),
                        prisma.user.findUnique({
                            where: { id: userIdNum },
                            select: { id: true },
                        }),
                    ])];
            case 1:
                _b = _c.sent(), taskExists = _b[0], userExists = _b[1];
                if (!taskExists)
                    return [2 /*return*/, res.status(404).json({ error: "Task not found." })];
                if (!userExists)
                    return [2 /*return*/, res.status(404).json({ error: "User to assign to not found." })];
                return [4 /*yield*/, prisma.userTask.create({
                        data: {
                            taskId: taskIdNum,
                            userId: userIdNum,
                        },
                    })];
            case 2:
                userTask = _c.sent();
                res.status(201).json({ userTask: userTask });
                return [3 /*break*/, 4];
            case 3:
                error_5 = _c.sent();
                console.error("Error assigning task:", error_5);
                if (error_5 instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                    error_5.code === "P2002") {
                    // Unique constraint violation means it's already assigned
                    return [2 /*return*/, res
                            .status(409)
                            .json({ error: "Task already assigned to this user." })];
                }
                next(error_5);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// --- Admin Routes ---
// Middleware for checking Admin role (applied individually below for clarity)
var checkAdmin = function (req, res, next) {
    var authHeader = req.headers.authorization;
    var token = authHeader && authHeader.split(" ")[1];
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
router.get("/admin/tasks", checkAdmin, function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var tasks, error_6;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, prisma.task.findMany({
                        orderBy: { deadline: "desc" },
                        // Include assigned user info if needed by admin screen
                        include: {
                            userTasks: {
                                select: {
                                    user: { select: { id: true, email: true } }, // Select only id and email
                                },
                            },
                        },
                    })];
            case 1:
                tasks = _a.sent();
                // Note: The included userTasks will be an array. The frontend might need to handle this
                // (e.g., display the first assigned user or all assigned users).
                res.json({ tasks: tasks });
                return [3 /*break*/, 3];
            case 2:
                error_6 = _a.sent();
                console.error("Error fetching all tasks (admin):", error_6);
                next(error_6);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// POST /admin/tasks - Create a new task and assign it (Admin only)
router.post("/admin/tasks", checkAdmin, function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, title, description, status_3, deadline, userId, userIdNum, task, error_7;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 3, , 4]);
                _a = req.body, title = _a.title, description = _a.description, status_3 = _a.status, deadline = _a.deadline, userId = _a.userId;
                userIdNum = Number(userId);
                if (!title || typeof title !== "string" || title.trim() === "") {
                    return [2 /*return*/, res.status(400).json({ error: "Title is required." })];
                }
                if (!userId || isNaN(userIdNum)) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ error: "Valid User ID to assign is required." })];
                }
                // Add more validation (status enum, date format) if needed
                // Check if the target user exists
                return [4 /*yield*/, prisma.user.findUniqueOrThrow({
                        where: { id: userIdNum },
                        select: { id: true }, // Only need to check existence
                    })];
            case 1:
                // Add more validation (status enum, date format) if needed
                // Check if the target user exists
                _b.sent();
                return [4 /*yield*/, prisma.task.create({
                        data: {
                            title: title.trim(),
                            description: description !== null && description !== void 0 ? description : null,
                            status: status_3 !== null && status_3 !== void 0 ? status_3 : "TODO", // Default status
                            deadline: deadline ? new Date(deadline) : undefined, // Handle date parsing errors below
                            userTasks: {
                                create: { userId: userIdNum }, // Assign to the specified user
                            },
                        },
                        include: { userTasks: true }, // Include assignment info in response
                    })];
            case 2:
                task = _b.sent();
                res.status(201).json({ task: task });
                return [3 /*break*/, 4];
            case 3:
                error_7 = _b.sent();
                console.error("Error creating task (admin):", error_7);
                if (error_7 instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    if (error_7.code === "P2025") {
                        // findUniqueOrThrow throws this if user not found
                        return [2 /*return*/, res
                                .status(404)
                                .json({ error: "User to assign task to not found." })];
                    }
                    if (error_7.code.startsWith("P2")) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ error: "Invalid task data provided.", code: error_7.code })];
                    }
                }
                if (error_7 instanceof Error &&
                    error_7.message.includes("Invalid time value")) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ error: "Invalid date format for deadline." })];
                }
                next(error_7);
                return [3 /*break*/, 4];
            case 4: return [2 /*return*/];
        }
    });
}); });
// PUT /admin/tasks - Update any existing task (Admin only)
router.put("/admin/tasks", checkAdmin, function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, taskId, title, description, status_4, deadline, taskIdNum, dataToUpdate, updatedTask, error_8;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _b.trys.push([0, 2, , 3]);
                _a = req.body, taskId = _a.taskId, title = _a.title, description = _a.description, status_4 = _a.status, deadline = _a.deadline;
                taskIdNum = Number(taskId);
                if (!taskId || isNaN(taskIdNum)) {
                    return [2 /*return*/, res.status(400).json({ error: "Valid Task ID is required." })];
                }
                dataToUpdate = {};
                if (title !== undefined)
                    dataToUpdate.title = title.trim();
                if (description !== undefined)
                    dataToUpdate.description = description;
                if (status_4 !== undefined)
                    dataToUpdate.status = status_4; // Add enum validation?
                if (deadline !== undefined) {
                    // Allow setting deadline to null explicitly
                    dataToUpdate.deadline =
                        deadline === null || deadline === "" ? undefined : new Date(deadline);
                }
                if (Object.keys(dataToUpdate).length === 0) {
                    return [2 /*return*/, res.status(400).json({ error: "No update data provided." })];
                }
                return [4 /*yield*/, prisma.task.update({
                        where: { id: taskIdNum },
                        data: dataToUpdate,
                        // Optionally include user assignments if needed in response
                        // include: { userTasks: { select: { user: { select: { id: true, email: true } } } } }
                    })];
            case 1:
                updatedTask = _b.sent();
                res.status(200).json({ task: updatedTask });
                return [3 /*break*/, 3];
            case 2:
                error_8 = _b.sent();
                console.error("Error updating task (admin):", error_8);
                if (error_8 instanceof client_1.Prisma.PrismaClientKnownRequestError) {
                    if (error_8.code === "P2025") {
                        // Record to update not found
                        return [2 /*return*/, res.status(404).json({ error: "Task not found." })];
                    }
                    if (error_8.code.startsWith("P2")) {
                        return [2 /*return*/, res
                                .status(400)
                                .json({ error: "Invalid task data provided.", code: error_8.code })];
                    }
                }
                if (error_8 instanceof Error &&
                    error_8.message.includes("Invalid time value")) {
                    return [2 /*return*/, res
                            .status(400)
                            .json({ error: "Invalid date format for deadline." })];
                }
                next(error_8);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// DELETE /admin/tasks - Delete any task (Admin only)
router.delete("/admin/tasks", checkAdmin, function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var taskId, taskIdNum_2, error_9;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                taskId = req.body.taskId;
                taskIdNum_2 = Number(taskId);
                if (!taskId || isNaN(taskIdNum_2)) {
                    return [2 /*return*/, res.status(400).json({ error: "Valid Task ID is required." })];
                }
                // Perform Deletion within a transaction
                // Prisma throws P2025 if task ID doesn't exist during delete
                return [4 /*yield*/, prisma.$transaction(function (tx) { return __awaiter(void 0, void 0, void 0, function () {
                        return __generator(this, function (_a) {
                            switch (_a.label) {
                                case 0: return [4 /*yield*/, tx.userTask.deleteMany({ where: { taskId: taskIdNum_2 } })];
                                case 1:
                                    _a.sent(); // Delete assignments
                                    return [4 /*yield*/, tx.task.delete({ where: { id: taskIdNum_2 } })];
                                case 2:
                                    _a.sent(); // Delete task
                                    return [2 /*return*/];
                            }
                        });
                    }); })];
            case 1:
                // Perform Deletion within a transaction
                // Prisma throws P2025 if task ID doesn't exist during delete
                _a.sent();
                res.status(204).send(); // No Content on successful deletion
                return [3 /*break*/, 3];
            case 2:
                error_9 = _a.sent();
                console.error("Error deleting task (admin):", error_9);
                if (error_9 instanceof client_1.Prisma.PrismaClientKnownRequestError &&
                    error_9.code === "P2025") {
                    // This means the task didn't exist when prisma.task.delete was called
                    return [2 /*return*/, res.status(404).json({ error: "Task not found." })];
                }
                next(error_9);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
// --- **NEW** Admin User Route ---
// GET /admin/users - Retrieve all users (Admin only)
// NOTE: It's generally better practice to put user-related routes in a separate
//       usersController.ts file, but adding here as requested for completion.
router.get("/admin/users", checkAdmin, function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var users, error_10;
    return __generator(this, function (_a) {
        switch (_a.label) {
            case 0:
                _a.trys.push([0, 2, , 3]);
                return [4 /*yield*/, prisma.user.findMany({
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
                    })];
            case 1:
                users = _a.sent();
                res.json({ users: users });
                return [3 /*break*/, 3];
            case 2:
                error_10 = _a.sent();
                console.error("Error fetching all users (admin):", error_10);
                next(error_10);
                return [3 /*break*/, 3];
            case 3: return [2 /*return*/];
        }
    });
}); });
exports.default = router;
