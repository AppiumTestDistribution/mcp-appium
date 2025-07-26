import { AndroidUiautomator2Driver } from 'appium-uiautomator2-driver';
import { XCUITestDriver } from 'appium-xcuitest-driver';

let driver: any = null;
let sessionId: string | null = null;

export function setSession(d: any, id: string) {
  driver = d;
  sessionId = id;
}

export function getDriver() {
  return driver;
}

export function getSessionId() {
  return sessionId;
}

export const getPlatformName = (driver: any): string => {
  if (driver instanceof AndroidUiautomator2Driver) return 'Android';
  if (driver instanceof XCUITestDriver) return 'iOS';
  throw new Error('Unknown driver type');
};
