import { XCUITestDriver } from "appium-xcuitest-driver";

const capabilities = {
  platformName: "iOS",
  "appium:automationName": "XCUITest",
  "appium:deviceName": "iPhone 16 Pro",
  "appium:platformVersion": "18.2",
  "appium:udid": "E9F10A3E-58E6-4506-B273-B22AF836014E",
};
console.log(
  "Creating new iOS session with capabilities:",
  JSON.stringify(capabilities, null, 2)
);

// Create a new UiAutomator2Driver instance

const driver = new XCUITestDriver();

// @ts-ignore
const sessionId = await driver.createSession(null, {
  alwaysMatch: capabilities,
  firstMatch: [{}],
});

console.log(driver.caps.automationName);

console.log(`Session created successfully with ID: ${sessionId}`);
