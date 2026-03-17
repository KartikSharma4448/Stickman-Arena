import { Router } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import pool from "../lib/db";

const router = Router();

router.post("/register", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });

  const u = username.trim();
  if (u.length < 3 || u.length > 20) return res.status(400).json({ error: "Username must be 3-20 characters" });
  if (!/^[a-zA-Z0-9_]+$/.test(u)) return res.status(400).json({ error: "Username: only letters, numbers, underscore" });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });

  const passwordHash = await bcrypt.hash(password, 10);
  const colors = ["#ff6b6b","#4ecdc4","#45b7d1","#96ceb4","#ffeaa7","#fd79a8","#a29bfe","#74b9ff","#00cec9","#fdcb6e"];
  const avatarColor = colors[Math.floor(Math.random() * colors.length)];

  try {
    const result = await pool.query(
      "INSERT INTO users (username, password_hash, avatar_color) VALUES ($1, $2, $3) RETURNING id, username, level, xp, coins, total_kills, total_deaths, total_matches, total_wins, avatar_color",
      [u, passwordHash, avatarColor]
    );
    const user = result.rows[0];
    const token = crypto.randomBytes(32).toString("hex");
    await pool.query("INSERT INTO sessions (user_id, token) VALUES ($1, $2)", [user.id, token]);
    res.json({ token, user });
  } catch (e: any) {
    if (e.code === "23505") return res.status(409).json({ error: "Username already taken" });
    console.error("register error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/login", async (req, res) => {
  const { username, password } = req.body as { username?: string; password?: string };
  if (!username || !password) return res.status(400).json({ error: "Username and password required" });

  try {
    const result = await pool.query("SELECT * FROM users WHERE username = $1", [username.trim()]);
    if (!result.rows.length) return res.status(401).json({ error: "Invalid username or password" });

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password_hash);
    if (!match) return res.status(401).json({ error: "Invalid username or password" });

    await pool.query("UPDATE users SET last_seen = NOW() WHERE id = $1", [user.id]);

    const token = crypto.randomBytes(32).toString("hex");
    await pool.query("INSERT INTO sessions (user_id, token) VALUES ($1, $2)", [user.id, token]);

    const { password_hash: _, ...safeUser } = user;
    res.json({ token, user: safeUser });
  } catch (e) {
    console.error("login error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/logout", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (token) await pool.query("DELETE FROM sessions WHERE token = $1", [token]);
  res.json({ ok: true });
});

router.get("/me", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });

  try {
    const sess = await pool.query(
      "SELECT s.user_id FROM sessions s WHERE s.token = $1 AND s.expires_at > NOW()",
      [token]
    );
    if (!sess.rows.length) return res.status(401).json({ error: "Invalid or expired token" });

    const userId = sess.rows[0].user_id;
    const userResult = await pool.query(
      "SELECT id, username, level, xp, coins, total_kills, total_deaths, total_matches, total_wins, avatar_color, created_at FROM users WHERE id = $1",
      [userId]
    );
    if (!userResult.rows.length) return res.status(404).json({ error: "User not found" });
    await pool.query("UPDATE users SET last_seen = NOW() WHERE id = $1", [userId]);
    res.json({ user: userResult.rows[0] });
  } catch (e) {
    console.error("me error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/update-stats", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "No token" });

  const { kills, deaths, won } = req.body as { kills?: number; deaths?: number; won?: boolean };

  try {
    const sess = await pool.query(
      "SELECT user_id FROM sessions WHERE token = $1 AND expires_at > NOW()", [token]
    );
    if (!sess.rows.length) return res.status(401).json({ error: "Unauthorized" });
    const userId = sess.rows[0].user_id;

    const xpEarned = ((kills ?? 0) * 10) + (won ? 100 : 20);
    await pool.query(`
      UPDATE users
      SET total_kills = total_kills + $1,
          total_deaths = total_deaths + $2,
          total_matches = total_matches + 1,
          total_wins = total_wins + $3,
          xp = xp + $4,
          level = GREATEST(1, FLOOR((xp + $4) / 500)::int + 1),
          last_seen = NOW()
      WHERE id = $5
    `, [kills ?? 0, deaths ?? 0, won ? 1 : 0, xpEarned, userId]);

    const updated = await pool.query(
      "SELECT id, username, level, xp, coins, total_kills, total_deaths, total_matches, total_wins, avatar_color FROM users WHERE id = $1",
      [userId]
    );
    res.json({ user: updated.rows[0], xpEarned });
  } catch (e) {
    console.error("update-stats error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.get("/search", async (req, res) => {
  const q = (req.query.q as string || "").trim();
  if (q.length < 2) return res.json({ users: [] });
  try {
    const result = await pool.query(
      "SELECT id, username, level, avatar_color FROM users WHERE username ILIKE $1 LIMIT 10",
      [`${q}%`]
    );
    res.json({ users: result.rows });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
