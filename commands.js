require("dotenv").config();
const { InstallGlobalCommands } = require("./utils.js");

// Simple test command
const TEST_COMMAND = {
  name: "test",
  description: "Basic command",
  type: 1,
};

// Command containing options
const FILTER_COMMAND = {
  name: "filtrar",
  description: "Filtrar mensajes a los que reaccionaste con emoji :pepenoted:",
  type: 1,
};

const ALL_COMMANDS = [TEST_COMMAND, FILTER_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
