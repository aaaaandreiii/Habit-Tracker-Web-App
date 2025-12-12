import { Router } from "express";
import { loginUser, registerUser } from "../services/authService";

const router = Router();

const isProd = process.env.NODE_ENV === "production";

// Keep cookie options centralized so login/register/logout stay consistent.
const tokenCookieOptions = {
  httpOnly: true as const,
  sameSite: "lax" as const,
  secure: isProd,
  // optional but common:
  // maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  // path: "/", // default is "/"
};

router.get("/login", (req, res) => {
  if (req.currentUser) return res.redirect("/dashboard");
  return res.render("auth-login", { layout: "main", title: "Login" });
});

router.get("/register", (req, res) => {
  if (req.currentUser) return res.redirect("/dashboard");
  return res.render("auth-register", { layout: "main", title: "Sign Up" });
});

router.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  try {
    const { token } = await registerUser({ name, email, password });

    return res
      .cookie("token", token, tokenCookieOptions)
      .redirect("/dashboard");
  } catch (err: any) {
    return res.status(400).render("auth-register", {
      layout: "main",
      title: "Sign Up",
      error: err.message,
      form: { name, email },
    });
  }
});

router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    const { token } = await loginUser({ email, password });

    return res
      .cookie("token", token, tokenCookieOptions)
      .redirect("/dashboard");
  } catch (err: any) {
    return res.status(400).render("auth-login", {
      layout: "main",
      title: "Login",
      error: err.message,
      form: { email },
    });
  }
});

router.post("/logout", (req, res) => {
  // If you set path/domain/maxAge above, use the same path/domain here too.
  return res
    .clearCookie("token", { ...tokenCookieOptions, maxAge: undefined })
    .redirect("/auth/login");
});

export default router;
