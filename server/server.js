// server/server.js
const express = require("express");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Приклад маршруту
app.get("/api/products", (req, res) => {
  res.json([
    { id: 1, name: "Product A" },
    { id: 2, name: "Product B" },
  ]);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
