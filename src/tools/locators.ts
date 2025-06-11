/**
 * Tool to get page source from the Android session
 */
import { z } from "zod";
import { getDriver } from "./sessionStore.js";
import { generateAllElementLocators } from "../locators/generate-all-locators.js";


export default function generateLocators(server: any): void {
  server.addTool({
    name: "generate_locators",
    description: `Generate locators for the current page.`,
    parameters: z.object({}),
    annotations: {
      readOnlyHint: true,
      openWorldHint: false,
    },
    execute: async (args: any, { log }: any): Promise<any> => {
      log.info("Getting page source");
      try {
        // Check for active driver session

        const driver = getDriver();
        if (!driver) {
          throw new Error(
            "No active driver session. Please create a session first."
          );
        }

        console.log("Getting page source");

        try {
          // Get the page source from the driver
          const pageSource = await driver.getPageSource();
          const driverName = (await driver.caps.automationName).toLowerCase();
          if (!pageSource) {
            throw new Error("Page source is empty or null");
          }
          const sampleXML = pageSource;
          const allElements = generateAllElementLocators(
            sampleXML,
            true,
            driverName
          );
          const interactableElements = generateAllElementLocators(
            sampleXML,
            true,
            driverName,
            {
              fetchableOnly: true,
            }
          );
          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  interactableElements,
                  message: "Page source retrieved successfully",
                  instruction:
                    `This the locators for the current page. Use this to generate code for the current page.
                     Using the template provided by generate://code-with-locators resource.`,
                }),
              },
            ],
          };
        } catch (parseError: any) {
          console.error("Error parsing XML:", parseError);
          throw new Error(`Failed to parse XML: ${parseError.message}`);
        }
      } catch (error: any) {
        console.error("Error getting page source:", error);
        throw new Error(`Failed to get page source: ${error.message}`);
      }
    },
  });
}
