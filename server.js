const express = require("express");
const Database = require("better-sqlite3");
const cors = require("cors");
const rateLimit = require("express-rate-limit");
const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// DB (luodaan jos ei ole)
const db = new Database("points.db");

const pointLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuutti
  max: 10,                 // max 10 tallennusta / IP / minuutti
  message: {
    error: "Liikaa tallennuksia. Yritä hetken päästä uudelleen."
  }
});
// 🔥 auto-init taulu (EI tarvitse poistaa db:tä enää)
db.exec(`
CREATE TABLE IF NOT EXISTS points (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  lat REAL,
  lng REAL,
  note TEXT,
  type TEXT,
  gps_lat REAL,
  gps_lng REAL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP
)
`);

// GET
app.get("/points", (req, res) => {
  const rows = db.prepare("SELECT * FROM points").all();
  res.json(rows);
});

// POST
app.post("/points", pointLimiter, (req, res) => {
  const { lat, lng, note, type, gps_lat, gps_lng } = req.body;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ error: "invalid coordinates" });
  }

  const stmt = db.prepare(`
    INSERT INTO points (lat, lng, note, type, gps_lat, gps_lng)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const info = stmt.run(
    lat,
    lng,
    note || "",
    type || "savipuoli",
    gps_lat ?? null,
    gps_lng ?? null
  );

  res.json({ id: info.lastInsertRowid });
});

// 🔥 server start
app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
  console.log("running");
});
