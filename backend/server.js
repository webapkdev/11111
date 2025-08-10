// server.js
const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const app = express();
const PORT = process.env.PORT || 3000;

// Supabase init
const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

// Dummy users (hardcoded for now)
const dummyUsers = {
  admin: { username: "admin", password: "admin123", role: "admin" },
  dev: { username: "dev", password: "dev123", role: "developer" }
};

// Login API
app.post("/api/login", (req, res) => {
  const { username, password } = req.body;
  for (let key in dummyUsers) {
    if (
      dummyUsers[key].username === username &&
      dummyUsers[key].password === password
    ) {
      return res.json({ success: true, role: dummyUsers[key].role });
    }
  }
  res.json({ success: false, message: "Invalid credentials" });
});

// Fetch all apps
app.get("/api/apps", async (req, res) => {
  const { data, error } = await supabase.from("apps").select("*");
  if (error) return res.status(500).json({ error: error.message });
  res.json(data);
});

// Add new app (developer)
app.post("/api/apps", async (req, res) => {
  const { name, description, apkUrl, role } = req.body;
  if (role !== "developer" && role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const { data, error } = await supabase
    .from("apps")
    .insert([{ name, description, apkUrl }]);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

// Approve or reject app (admin)
app.post("/api/apps/:id/approve", async (req, res) => {
  const { role, approve } = req.body;
  if (role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const { data, error } = await supabase
    .from("apps")
    .update({ approved: approve })
    .eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true, data });
});

// Delete app (admin)
app.delete("/api/apps/:id", async (req, res) => {
  const { role } = req.body;
  if (role !== "admin") {
    return res.status(403).json({ error: "Unauthorized" });
  }
  const { error } = await supabase.from("apps").delete().eq("id", req.params.id);
  if (error) return res.status(500).json({ error: error.message });
  res.json({ success: true });
});

// Serve frontend
app.get("*", (req, res) => {
  res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
