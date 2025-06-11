// Export all tools
import createSession from "./create-session.js";
import generateLocators from "./locators.js";

export default function registerTools(server: any): void {
  // Register all tools
  createSession(server);
  generateLocators(server);
  console.log("All tools registered");
}
