require("dotenv").config();
const express = require("express");
app.set("trust proxy", 1);
const { createClient } = require("@supabase/supabase-js");
const cors = require("cors");
const rateLimit = require("express-rate-limit");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static("public"));

// SUPABASE
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY
);

const pointLimiter = rateLimit({
  windowMs: 1 * 60 * 1000, // 1 minuutti
  max: 10,                 // max 10 tallennusta / IP / minuutti
  message: {
    error: "Liikaa tallennuksia. Yritä hetken päästä uudelleen."
  }
});



// GET
app.get("/points", async (req, res) => {
  const { data, error } = await supabase
    .from("points")
    .select("*");

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json(data);
});

// POST
app.post("/points", pointLimiter, async (req, res) => {
  const { lat, lng, note, type, gps_lat, gps_lng } = req.body;

  if (typeof lat !== "number" || typeof lng !== "number") {
    return res.status(400).json({ error: "invalid coordinates" });
  }

  const { data, error } = await supabase
    .from("points")
    .insert([
      {
        lat,
        lng,
        note: note || "",
        type: type || "savipuoli",
        gps_lat: gps_lat ?? null,
        gps_lng: gps_lng ?? null
      }
    ])
    .select()
    .single();

  if (error) {
    return res.status(500).json({ error: error.message });
  }

  res.json({ id: data.id, ...data });
});

// 🔥 server start
app.listen(process.env.PORT || 3000, "0.0.0.0", () => {
  console.log("running");
});
