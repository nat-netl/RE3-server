const express = require("express");
const cors = require("cors");
require("dotenv").config();

const authRoutes = require("./routes/auth");
const taskRoutes = require("./routes/tasks");
const userRoutes = require("./routes/user");

const telegramService = require("./services/telegramService");

const app = express();

// Настройка CORS с использованием переменной окружения
app.use(
  cors({
    origin:
      process.env.FRONTEND_URL ||
      "https://melodious-strudel-721f0a.netlify.app/onboarding",
    credentials: true, // Если вы используете куки или авторизацию http://localhost:5173
  })
);

app.use(express.json());

app.use((req, res, next) => {
  console.log(`${req.method} ${req.path}`);
  next();
});

app.use("/api/auth", authRoutes);
app.use("/api/tasks", taskRoutes);
app.use("/api/users", userRoutes);

app.get("/", (req, res) => {
  res.send("TON Telegram App API");
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
  console.log(
    `Accepting requests from: ${
      process.env.FRONTEND_URL ||
      "https://melodious-strudel-721f0a.netlify.app/onboarding"
    }`
  );

  // const tel = telegramService.checkChannelSubscription(1438560864, "testRe2Front")
  // console.log (tel)
});

module.exports = app;
