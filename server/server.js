require("dotenv").config();
const dns = require("dns");
const app = require("./app");
const connectDB = require("./src/config/database");
dns.setServers(["1.1.1.1", "8.8.8.8"]);
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });
});
