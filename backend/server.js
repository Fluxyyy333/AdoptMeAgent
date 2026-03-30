const express = require("express");
const cors = require("cors");

const app = express();
app.use(cors());
app.use(express.json());

app.use("/api/devices",  require("./routes/devices"));
app.use("/api/ps",       require("./routes/ps"));
app.use("/api/cookies",  require("./routes/cookies"));
app.use("/api/config",   require("./routes/config"));

// Mark devices offline if not seen for >2 minutes
setInterval(() => {
  const cutoff = Date.now() - 2 * 60 * 1000;
  require("./db").prepare(
    "UPDATE devices SET status='offline' WHERE last_seen < ? AND status != 'offline'"
  ).run(cutoff);
}, 30_000);

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Backend running on http://localhost:${PORT}`));
