/**
 * Tool to select mobile platform before creating a session
 */
import { z } from "zod";

export default function selectPlatform(server: any): void {
  server.addTool({
    name: "select_platform",
    description: "REQUIRED: First select the mobile platform (Android or iOS) you want to work with before creating a session",
    parameters: z.object({
      platform: z
        .enum(["ios", "android"])
        .describe("REQUIRED: Choose your target platform - Type 'android' for Android devices/emulators or 'ios' for iOS devices/simulators. You must select one before proceeding."),
    }),
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
    },
    execute: async (args: any, context: any): Promise<any> => {
      try {
        const { platform } = args;
        
        let platformInfo: string;
        let nextSteps: string;
        
        if (platform === "android") {
          platformInfo = "Android platform selected";
          nextSteps = "You can now create an Android session using the create_session tool with platform='android'. Make sure you have:\n" +
                     "• Android SDK installed\n" +
                     "• Android device connected or emulator running\n" +
                     "• USB debugging enabled (for real devices)";
        } else if (platform === "ios") {
          platformInfo = "iOS platform selected";
          nextSteps = "You can now create an iOS session using the create_session tool with platform='ios'. Make sure you have:\n" +
                     "• Xcode installed (macOS only)\n" +
                     "• iOS device connected or simulator running\n" +
                     "• Developer certificates configured (for real devices)\n" +
                     "• Note: iOS testing requires macOS";
        } else {
          throw new Error(`Invalid platform: ${platform}. Please choose 'android' or 'ios'.`);
        }

        console.log(`Platform selected: ${platform.toUpperCase()}`);

        return {
          content: [
            {
              type: "text",
              text: `✅ ${platformInfo}\n\n📋 Next Steps:\n${nextSteps}\n\n🚀 Ready to create a session? Use the create_session tool with platform='${platform}'`,
            },
          ],
        };
      } catch (error: any) {
        console.error("Error selecting platform:", error);
        throw new Error(`Failed to select platform: ${error.message}`);
      }
    },
  });
}
