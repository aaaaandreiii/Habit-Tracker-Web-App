"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.createApp = void 0;
const path_1 = __importDefault(require("path"));
const express_1 = __importDefault(require("express"));
const cookie_parser_1 = __importDefault(require("cookie-parser"));
const morgan_1 = __importDefault(require("morgan"));
const express_handlebars_1 = require("express-handlebars");
const date_fns_1 = require("date-fns");
const auth_1 = __importDefault(require("./routes/auth"));
const dashboard_1 = __importDefault(require("./routes/dashboard"));
const habits_1 = __importDefault(require("./routes/habits"));
const nutrition_1 = __importDefault(require("./routes/nutrition"));
const journal_1 = __importDefault(require("./routes/journal"));
const profile_1 = __importDefault(require("./routes/profile"));
const auth_2 = require("./middleware/auth");
const createApp = () => {
    const app = (0, express_1.default)();
    const viewsDir = path_1.default.join(process.cwd(), 'server/views');
    app.engine('hbs', (0, express_handlebars_1.engine)({
        extname: '.hbs',
        defaultLayout: 'main',
        layoutsDir: path_1.default.join(viewsDir, 'layouts'),
        partialsDir: path_1.default.join(viewsDir, 'partials'),
        helpers: {
            json: (context) => JSON.stringify(context),
            // (completed / total) * hundred
            multiply: (completed, hundred, total) => {
                const c = Number(completed) || 0;
                const h = Number(hundred) || 0;
                const t = Number(total) || 0;
                if (!t)
                    return 0;
                return (c * h) / t;
            },
            // equality helper used as: (eq a b)
            eq: (a, b) => a === b,
            // class for habit heatmap intensity
            heatmapClass: (completed) => {
                const c = Number(completed) || 0;
                if (c === 0)
                    return 'bg-slate-100 dark:bg-slate-800 text-slate-400';
                if (c === 1)
                    return 'bg-emerald-100 text-emerald-700';
                if (c <= 3)
                    return 'bg-emerald-300 text-emerald-900';
                return 'bg-emerald-500 text-white';
            },
            dateInput: (date) => {
                if (!date)
                    return '';
                const d = date instanceof Date ? date : new Date(date);
                return (0, date_fns_1.format)(d, 'yyyy-MM-dd');
            },
        },
    }));
    app.set('view engine', 'hbs');
    app.set('views', viewsDir);
    app.use((0, morgan_1.default)('dev'));
    app.use(express_1.default.urlencoded({ extended: true }));
    app.use(express_1.default.json());
    app.use((0, cookie_parser_1.default)());
    app.use(express_1.default.static(path_1.default.join(__dirname, '../public')));
    app.use(auth_2.attachUser);
    app.get('/', (req, res) => {
        if (req.currentUser)
            return res.redirect('/dashboard');
        res.redirect('/auth/login');
    });
    app.use('/auth', auth_1.default);
    app.use('/dashboard', dashboard_1.default);
    app.use('/habits', habits_1.default);
    app.use('/nutrition', nutrition_1.default);
    app.use('/journal', journal_1.default);
    app.use('/profile', profile_1.default);
    // ---- 404 (Not Found) ----
    app.use((req, res) => {
        res.status(404);
        if (req.accepts('html')) {
            return res.render('error-404', {
                layout: 'main',
                title: 'Page not found',
                url: req.originalUrl,
                user: req.currentUser,
            });
        }
        if (req.accepts('json')) {
            return res.json({ error: 'Not found' });
        }
        return res.type('txt').send('Not found');
    });
    // ---- Generic error handler ----
    app.use((err, req, res, _next) => {
        console.error(err);
        const status = err.status || 500;
        res.status(status);
        if (req.accepts('html')) {
            return res.render('error-500', {
                layout: 'main',
                title: 'Something went wrong',
                message: err.message ?? 'Unexpected error',
                user: req.currentUser,
            });
        }
        if (req.accepts('json')) {
            return res.json({ error: 'Internal server error' });
        }
        return res.type('txt').send('Internal server error');
    });
    return app;
};
exports.createApp = createApp;
