// api/routes/auth.js
const express = require("express");
const passport = require("passport");
const { PrismaClient } = require("@prisma/client");

const router = express.Router();
const prisma = new PrismaClient();

/**
 * 🔹 Start Google OAuth login
 */
router.get(
  "/google",
  passport.authenticate("google", { scope: ["profile", "email"] })
);

/**
 * 🔹 Google OAuth callback
 */
router.get(
  "/google/callback",
  passport.authenticate("google", {
    failureRedirect: `${process.env.ADMIN_URL}/login`,
    session: true,
  }),
  (req, res) => {
    // ✅ Redirect user to admin app after successful login
    res.redirect(`${process.env.ADMIN_URL}/dashboard`);
  }
);

/**
 * 🔹 Logout route
 */
router.get("/logout", (req, res) => {
  req.logout(function (err) {
    if (err) {
      console.error("Logout error:", err);
      return res.status(500).json({ success: false });
    }
    req.session.destroy(() => {
      res.clearCookie("connect.sid");
      res.json({ success: true });
    });
  });
});

/**
 * 🔹 Auth status (verify if user is still authenticated)
 */
router.get("/status", async (req, res) => {
  try {
    if (!req.isAuthenticated() || !req.user) {
      return res.json({ loggedIn: false });
    }

    // Always re-check database for the latest `can_login`
    const freshUser = await prisma.users.findUnique({
      where: { id: req.user.id },
      select: {
        id: true,
        username: true,
        email: true,
        role: true,
        can_login: true,
      },
    });

    // 🚫 If user is deleted or login disabled
    if (!freshUser || !freshUser.can_login) {
      console.warn(`Blocked access for user ID: ${req.user.id}`);
      req.logout(() => {
        req.session.destroy(() => {});
      });
      return res.json({ loggedIn: false, message: "Access revoked" });
    }

    // ✅ User is still valid
    res.json({
      loggedIn: true,
      user: {
        id: freshUser.id,
        username: freshUser.username,
        email: freshUser.email,
        role: freshUser.role,
      },
    });
  } catch (err) {
    console.error("Auth status error:", err);
    res.status(500).json({ loggedIn: false });
  }
});

module.exports = router;
