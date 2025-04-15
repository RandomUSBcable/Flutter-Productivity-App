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
exports.registerHandler = exports.loginHandler = void 0;
var client_1 = require("@prisma/client");
var bcrypt = require("bcryptjs");
var jwt = require("jsonwebtoken");
var prisma = new client_1.PrismaClient();
var loginHandler = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, user, isPasswordValid, token, error_1;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, email = _a.email, password = _a.password;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 4, , 5]);
                return [4 /*yield*/, prisma.user.findUnique({
                        where: { email: email },
                    })];
            case 2:
                user = _b.sent();
                if (!user) {
                    res.status(400).json({ error: "Invalid email or password." });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, bcrypt.compare(password, user.password)];
            case 3:
                isPasswordValid = _b.sent();
                if (!isPasswordValid) {
                    res.status(400).json({ error: "Invalid email or password." });
                    return [2 /*return*/];
                }
                token = jwt.sign({
                    id: user.id,
                    email: user.email,
                    role: user.role,
                }, process.env.JWT_SECRET, { expiresIn: "1h" });
                res.json({ token: token });
                return [3 /*break*/, 5];
            case 4:
                error_1 = _b.sent();
                console.error("Login error:", error_1);
                next(error_1);
                return [3 /*break*/, 5];
            case 5: return [2 /*return*/];
        }
    });
}); };
exports.loginHandler = loginHandler;
/**
 * POST /register
 * Registers a new user.
 * Expects email, password, and confirmPassword in the request body.
 */
var registerHandler = function (req, res, next) { return __awaiter(void 0, void 0, void 0, function () {
    var _a, email, password, confirmPassword, existingUser, hashedPassword, newUser, token, error_2;
    return __generator(this, function (_b) {
        switch (_b.label) {
            case 0:
                _a = req.body, email = _a.email, password = _a.password, confirmPassword = _a.confirmPassword;
                _b.label = 1;
            case 1:
                _b.trys.push([1, 5, , 6]);
                // Check if password and confirmPassword match.
                if (password !== confirmPassword) {
                    res.status(400).json({ error: "Passwords do not match." });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, prisma.user.findUnique({ where: { email: email } })];
            case 2:
                existingUser = _b.sent();
                if (existingUser) {
                    res.status(400).json({ error: "A user with that email already exists." });
                    return [2 /*return*/];
                }
                return [4 /*yield*/, bcrypt.hash(password, 10)];
            case 3:
                hashedPassword = _b.sent();
                return [4 /*yield*/, prisma.user.create({
                        data: {
                            email: email,
                            password: hashedPassword,
                            role: "USER",
                        },
                    })];
            case 4:
                newUser = _b.sent();
                token = jwt.sign({
                    id: newUser.id,
                    email: newUser.email,
                    role: newUser.role,
                }, process.env.JWT_SECRET, { expiresIn: "1h" });
                res.status(201).json({
                    token: token,
                    user: { id: newUser.id, email: newUser.email, role: newUser.role },
                });
                return [3 /*break*/, 6];
            case 5:
                error_2 = _b.sent();
                console.error("Registration error:", error_2);
                next(error_2);
                return [3 /*break*/, 6];
            case 6: return [2 /*return*/];
        }
    });
}); };
exports.registerHandler = registerHandler;
