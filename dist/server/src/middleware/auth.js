"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.attachUser = attachUser;
exports.requireAuth = requireAuth;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
async function attachUser(req, _res, next) {
    const token = req.cookies?.token;
    if (!token) {
        req.currentUser = null;
        return next();
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, JWT_SECRET);
        const user = await prisma_1.prisma.user.findUnique({
            where: { id: decoded.id },
            select: { id: true, email: true, name: true },
        });
        req.currentUser = user || null;
    }
    catch (err) {
        req.currentUser = null;
    }
    next();
}
function requireAuth(req, res, next) {
    if (!req.currentUser) {
        return res.redirect('/auth/login');
    }
    next();
}
