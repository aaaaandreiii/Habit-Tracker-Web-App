import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import { prisma } from "../lib/prisma";

const JWT_SECRET = process.env.JWT_SECRET || "changeme";

export async function registerUser(params: {
  name: string;
  email: string;
  password: string;
}) {
  const existing = await prisma.user.findUnique({
    where: { email: params.email },
  });
  if (existing) throw new Error("Email already in use");

  const passwordHash = await bcrypt.hash(params.password, 10);

  const user = await prisma.user.create({
    data: {
      email: params.email,
      name: params.name,
      passwordHash,
    },
  });

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });

  return { user, token };
}

export async function loginUser(params: { email: string; password: string }) {
  const user = await prisma.user.findUnique({ where: { email: params.email } });
  if (!user) throw new Error("Invalid credentials");

  const valid = await bcrypt.compare(params.password, user.passwordHash);
  if (!valid) throw new Error("Invalid credentials");

  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, {
    expiresIn: "7d",
  });

  return { user, token };
}
