import { Router } from "express";
import { requireAuth } from "../middleware/auth";
import { prisma } from "../lib/prisma";

const router = Router();

router.get("/", requireAuth, async (req, res) => {
  const entries = await prisma.journalEntry.findMany({
    where: { userId: req.currentUser!.id },
    orderBy: { date: "desc" },
    take: 50,
  });

  res.render("journal-index", {
    layout: "main",
    title: "Journal",
    user: req.currentUser,
    entries,
  });
});

router.post("/new", requireAuth, async (req, res) => {
  const { date, title, content, tags } = req.body;
  await prisma.journalEntry.create({
    data: {
      userId: req.currentUser!.id,
      date: date ? new Date(date) : new Date(),
      title,
      content,
      tags,
    },
  });
  res.redirect("/journal");
});

export default router;
