const { boot } = require("./server-app");

boot(Number(process.env.PORT) || 4173);
