"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.registerUser = registerUser;
exports.loginUser = loginUser;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const prisma_1 = require("../lib/prisma");
const JWT_SECRET = process.env.JWT_SECRET || 'changeme';
async function registerUser(params) {
    const existing = await prisma_1.prisma.user.findUnique({ where: { email: params.email } });
    if (existing)
        throw new Error('Email already in use');
    const passwordHash = await bcryptjs_1.default.hash(params.password, 10);
    const user = await prisma_1.prisma.user.create({
        data: {
            email: params.email,
            name: params.name,
            passwordHash,
        },
    });
    const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: '7d',
    });
    return { user, token };
}
async function loginUser(params) {
    const user = await prisma_1.prisma.user.findUnique({ where: { email: params.email } });
    if (!user)
        throw new Error('Invalid credentials');
    const valid = await bcryptjs_1.default.compare(params.password, user.passwordHash);
    if (!valid)
        throw new Error('Invalid credentials');
    const token = jsonwebtoken_1.default.sign({ id: user.id, email: user.email }, JWT_SECRET, {
        expiresIn: '7d',
    });
    return { user, token };
}
