import { AndroidUiautomator2Driver } from 'appium-uiautomator2-driver';
import { XCUITestDriver } from 'appium-xcuitest-driver';

let driver: any = null;
let sessionId: string | null = null;
let isDeletingSession = false; // Lock to prevent concurrent deletion

export function setSession(d: any, id: string | null) {
  driver = d;
  sessionId = id;
  // Reset deletion flag when setting a new session
  if (d && id) {
    isDeletingSession = false;
  }
}

export function getDriver() {
  return driver;
}

export function getSessionId() {
  return sessionId;
}

export function isDeletingSessionInProgress() {
  return isDeletingSession;
}

export function hasActiveSession(): boolean {
  return driver !== null && sessionId !== null && !isDeletingSession;
}

export async function safeDeleteSession(): Promise<boolean> {
  // Check if there's no session to delete
  if (!driver || !sessionId) {
    console.log('No active session to delete.');
    return false;
  }

  // Check if deletion is already in progress
  if (isDeletingSession) {
    console.log('Session deletion already in progress, skipping...');
    return false;
  }

  // Set lock
  isDeletingSession = true;

  try {
    console.log('Deleting current session');
    await driver.deleteSession();
    
    // Clear the session from store
    driver = null;
    sessionId = null;
    
    console.log('Session deleted successfully.');
    return true;
  } catch (error) {
    console.error('Error deleting session:', error);
    throw error;
  } finally {
    // Always release lock
    isDeletingSession = false;
  }
}

export const getPlatformName = (driver: any): string => {
  if (driver instanceof AndroidUiautomator2Driver) return 'Android';
  if (driver instanceof XCUITestDriver) return 'iOS';
  throw new Error('Unknown driver type');
};
