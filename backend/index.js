// backend/index.js
const express = require("express");
const cors = require("cors");
const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

app.get("/", (req, res) => {
  res.send("API is working....!!!!!");
});

const exploreRoutes = require("./routes/explore");
app.use("/api", exploreRoutes);

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
