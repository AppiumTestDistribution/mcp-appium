import { AndroidUiautomator2Driver } from "appium-uiautomator2-driver";

const capabilities = {
  platformName: "Android",
  "appium:automationName": "UiAutomator2",
  "appium:deviceName": "Android Device",
};
console.log(
  "Creating new Android session with capabilities:",
  JSON.stringify(capabilities, null, 2)
);

// Create a new UiAutomator2Driver instance

const driver = new AndroidUiautomator2Driver();

// @ts-ignore
const sessionId = await driver.createSession(null, {
  alwaysMatch: capabilities,
  firstMatch: [{}],
});

console.log(`Session created successfully with ID: ${sessionId}`);
