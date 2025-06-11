import { FastMCP } from "fastmcp";
import registerTools from "./tools/index.js";
import registerResources from "./resources/index.js";

const server = new FastMCP({
  name: "Appium Gestures",
  version: "1.0.0",
  instructions: "MCP server providing resources and tools for Mobile Agent",
});

registerResources(server);
registerTools(server);
export default server;
