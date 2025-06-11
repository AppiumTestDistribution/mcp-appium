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
