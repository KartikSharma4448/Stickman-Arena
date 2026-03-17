import { Router } from "express";
import pool from "../lib/db";

const router = Router();

async function getUserIdFromToken(token: string): Promise<number | null> {
  const sess = await pool.query(
    "SELECT user_id FROM sessions WHERE token = $1 AND expires_at > NOW()", [token]
  );
  return sess.rows[0]?.user_id ?? null;
}

router.get("/", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const userId = await getUserIdFromToken(token);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  try {
    const result = await pool.query(`
      SELECT
        u.id, u.username, u.level, u.avatar_color, u.last_seen,
        f.status,
        CASE WHEN f.requester_id = $1 THEN 'sent' ELSE 'received' END as direction
      FROM friends f
      JOIN users u ON (
        CASE WHEN f.requester_id = $1 THEN f.receiver_id ELSE f.requester_id END = u.id
      )
      WHERE ($1 = f.requester_id OR $1 = f.receiver_id)
    `, [userId]);
    res.json({ friends: result.rows });
  } catch (e) {
    console.error("friends list error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/add", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const userId = await getUserIdFromToken(token);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { username } = req.body as { username?: string };
  if (!username) return res.status(400).json({ error: "Username required" });

  try {
    const targetResult = await pool.query("SELECT id, username FROM users WHERE username = $1", [username.trim()]);
    if (!targetResult.rows.length) return res.status(404).json({ error: "User not found" });
    const target = targetResult.rows[0];
    if (target.id === userId) return res.status(400).json({ error: "Cannot add yourself" });

    const existing = await pool.query(
      "SELECT * FROM friends WHERE (requester_id = $1 AND receiver_id = $2) OR (requester_id = $2 AND receiver_id = $1)",
      [userId, target.id]
    );
    if (existing.rows.length) {
      const f = existing.rows[0];
      if (f.status === "accepted") return res.status(409).json({ error: "Already friends" });
      if (f.status === "pending") return res.status(409).json({ error: "Request already sent" });
    }

    await pool.query(
      "INSERT INTO friends (requester_id, receiver_id, status) VALUES ($1, $2, 'pending') ON CONFLICT DO NOTHING",
      [userId, target.id]
    );
    res.json({ ok: true, message: `Friend request sent to ${target.username}` });
  } catch (e) {
    console.error("add friend error:", e);
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/accept", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const userId = await getUserIdFromToken(token);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { requesterId } = req.body as { requesterId?: number };
  if (!requesterId) return res.status(400).json({ error: "requesterId required" });

  try {
    await pool.query(
      "UPDATE friends SET status = 'accepted' WHERE requester_id = $1 AND receiver_id = $2 AND status = 'pending'",
      [requesterId, userId]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

router.post("/reject", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const userId = await getUserIdFromToken(token);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { requesterId } = req.body as { requesterId?: number };
  if (!requesterId) return res.status(400).json({ error: "requesterId required" });

  try {
    await pool.query(
      "DELETE FROM friends WHERE requester_id = $1 AND receiver_id = $2 AND status = 'pending'",
      [requesterId, userId]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

router.delete("/remove", async (req, res) => {
  const token = req.headers.authorization?.replace("Bearer ", "");
  if (!token) return res.status(401).json({ error: "Unauthorized" });
  const userId = await getUserIdFromToken(token);
  if (!userId) return res.status(401).json({ error: "Unauthorized" });

  const { friendId } = req.body as { friendId?: number };
  if (!friendId) return res.status(400).json({ error: "friendId required" });

  try {
    await pool.query(
      "DELETE FROM friends WHERE (requester_id = $1 AND receiver_id = $2) OR (requester_id = $2 AND receiver_id = $1)",
      [userId, friendId]
    );
    res.json({ ok: true });
  } catch (e) {
    res.status(500).json({ error: "Server error" });
  }
});

export default router;
