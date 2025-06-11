/**
 * Tool to create a new Android session
 */
import { z } from "zod";
import { AndroidUiautomator2Driver } from "appium-uiautomator2-driver";
import { setSession, getDriver, getSessionId } from "./sessionStore.js";
// Define capabilities type
interface Capabilities {
  platformName: string;
  "appium:automationName": string;
  "appium:deviceName": string;
  [key: string]: any;
}

export default function createSession(server: any): void {
  server.addTool({
    name: "create_session",
    description: "Create a new session with the Android device",
    parameters: z.object({
      capabilities: z
        .object({})
        .default({
          platformName: "Android",
          "appium:automationName": "UiAutomator2",
        })
        .describe("Desired capabilities for the Android session (W3C format)"),
    }),
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
    },
    execute: async (args: any, context: any): Promise<any> => {
      try {
        const capabilities = args.capabilities as Capabilities;
        console.log(
          "Creating new Android session with capabilities:",
          JSON.stringify(capabilities, null, 2)
        );

        const driver = new AndroidUiautomator2Driver();

        // @ts-ignore
        const sessionId = await driver.createSession(null, {
          alwaysMatch: {
            platformName: "Android",
            "appium:automationName": "UiAutomator2",
            "appium:deviceName": "Android Device",
          },
          firstMatch: [{}],
        });

        setSession(driver, sessionId);

        console.log(`Session created successfully with ID: ${sessionId}`);

        return {
          content: [
            {
              type: "text",
              text: `Session created successfully with ID: ${sessionId}`,
            },
          ],
        };
      } catch (error: any) {
        console.error("Error creating session:", error);
        throw new Error(`Failed to create session: ${error.message}`);
      }
    },
  });
}
