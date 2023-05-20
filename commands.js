require("dotenv").config();
const { capitalize, InstallGlobalCommands } = require("./utils.js");

// Simple test command
const TEST_COMMAND = {
  name: "test",
  description: "Basic command",
  type: 1,
};

// Command containing options
const FILTER_COMMAND = {
  name: "filter",
  description: "Filter by emoji",
  type: 1,
};

const ALL_COMMANDS = [TEST_COMMAND, FILTER_COMMAND];

InstallGlobalCommands(process.env.APP_ID, ALL_COMMANDS);
