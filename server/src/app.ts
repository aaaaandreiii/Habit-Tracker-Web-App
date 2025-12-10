import path from "path";
import express from "express";
import cookieParser from "cookie-parser";
import morgan from "morgan";
import { engine } from "express-handlebars";
import { format } from "date-fns";
import authRoutes from "./routes/auth";
import dashboardRoutes from "./routes/dashboard";
import habitRoutes from "./routes/habits";
import nutritionRoutes from "./routes/nutrition";
import journalRoutes from "./routes/journal";
import profileRoutes from "./routes/profile";
import { attachUser } from "./middleware/auth";

export const createApp = () => {
  const app = express();

  const projectRoot = process.cwd();
  const viewsDir = path.join(projectRoot, "server/views");
  const publicDir = path.join(projectRoot, "server/public");

  app.engine(
    "hbs",
    engine({
      extname: ".hbs",
      defaultLayout: "main",
      layoutsDir: path.join(viewsDir, "layouts"),
      partialsDir: path.join(viewsDir, "partials"),
      helpers: {
        json: (context: any) => JSON.stringify(context),

        // (completed / total) * hundred
        multiply: (completed: any, hundred: any, total: any) => {
          const c = Number(completed) || 0;
          const h = Number(hundred) || 0;
          const t = Number(total) || 0;
          if (!t) return 0;
          return (c * h) / t;
        },

        // equality helper used as: (eq a b)
        eq: (a: any, b: any) => a === b,

        // class for habit heatmap intensity
        heatmapClass: (completed: any) => {
          const c = Number(completed) || 0;
          if (c === 0) return "bg-slate-100 dark:bg-slate-800 text-slate-400";
          if (c === 1) return "bg-emerald-100 text-emerald-700";
          if (c <= 3) return "bg-emerald-300 text-emerald-900";
          return "bg-emerald-500 text-white";
        },

        dateInput: (date: any) => {
          if (!date) return "";
          const d = date instanceof Date ? date : new Date(date);
          return format(d, "yyyy-MM-dd");
        },

        // /** Did this habit get COMPLETED today? (for boolean habits & badges) */
        // habitCompleted: (logs: any[]) => {
        //   if (!Array.isArray(logs)) return false;
        //   return logs.some((l) => l.status === 'COMPLETED');
        // },

        // /** Numeric value for today (for quantity / duration habits) */
        // habitValue: (logs: any[]) => {
        //   if (!Array.isArray(logs) || logs.length === 0) return 0;
        //   const latest = logs[logs.length - 1];
        //   return typeof latest.value === 'number' ? latest.value : 0;
        // },

        // NEW: does this habit have a COMPLETED log today?
        habitCompleted: (logs: any[]) => {
          if (!Array.isArray(logs)) return false;
          return logs.some((l) => l.status === "COMPLETED");
        },

        // NEW: numeric value from today’s log (QUANTITY/DURATION)
        habitValue: (logs: any[]) => {
          if (!Array.isArray(logs) || !logs.length) return 0;
          const log = logs[0];
          return typeof log.value === "number" ? log.value : 0;
        },

        includesDay: (days: any, token: any) => {
          if (!days || !token) return false;
          const list = String(days)
            .split(",")
            .map((s) => s.trim().toUpperCase())
            .filter(Boolean);
          return list.includes(String(token).toUpperCase());
        },
      },
    }),
  );
  app.set("view engine", "hbs");
  app.set("views", viewsDir);

  app.use(morgan("dev"));
  app.use(express.urlencoded({ extended: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use(express.static(publicDir));
  app.use(attachUser);

  app.get("/", (req, res) => {
    if (req.currentUser) return res.redirect("/dashboard");
    res.redirect("/auth/login");
  });

  app.use("/auth", authRoutes);
  app.use("/dashboard", dashboardRoutes);
  app.use("/habits", habitRoutes);
  app.use("/nutrition", nutritionRoutes);
  app.use("/journal", journalRoutes);
  app.use("/profile", profileRoutes);

  // ---- 404 (Not Found) ----
  app.use((req, res) => {
    res.status(404);

    if (req.accepts("html")) {
      return res.render("error-404", {
        layout: "main",
        title: "Page not found",
        url: req.originalUrl,
        user: req.currentUser,
      });
    }

    if (req.accepts("json")) {
      return res.json({ error: "Not found" });
    }

    return res.type("txt").send("Not found");
  });

  // ---- Generic error handler ----
  app.use(
    (
      err: any,
      req: express.Request,
      res: express.Response,
      _next: express.NextFunction,
    ) => {
      console.error(err);
      const status = err.status || 500;
      res.status(status);

      if (req.accepts("html")) {
        return res.render("error-500", {
          layout: "main",
          title: "Something went wrong",
          message: err.message ?? "Unexpected error",
          user: req.currentUser,
        });
      }

      if (req.accepts("json")) {
        return res.json({ error: "Internal server error" });
      }

      return res.type("txt").send("Internal server error");
    },
  );

  return app;
};
