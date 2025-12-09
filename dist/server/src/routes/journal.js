"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const prisma_1 = require("../lib/prisma");
const router = (0, express_1.Router)();
router.get('/', auth_1.requireAuth, async (req, res) => {
    const entries = await prisma_1.prisma.journalEntry.findMany({
        where: { userId: req.currentUser.id },
        orderBy: { date: 'desc' },
        take: 50,
    });
    res.render('journal-index', {
        layout: 'main',
        title: 'Journal',
        user: req.currentUser,
        entries,
    });
});
router.post('/new', auth_1.requireAuth, async (req, res) => {
    const { date, title, content, tags } = req.body;
    await prisma_1.prisma.journalEntry.create({
        data: {
            userId: req.currentUser.id,
            date: date ? new Date(date) : new Date(),
            title,
            content,
            tags,
        },
    });
    res.redirect('/journal');
});
exports.default = router;
