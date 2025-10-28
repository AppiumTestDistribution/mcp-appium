/**
 * Tool to install and launch WebDriverAgent (WDA) on a booted iOS simulator
 */
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import { access, readdir, stat } from 'fs/promises';
import { constants } from 'fs';
import fs from 'fs'; // Keep for createWriteStream if used
import os from 'os';

const execAsync = promisify(exec);

function cachePath(folder: string): string {
  return path.join(os.homedir(), '.cache', 'appium-mcp', folder);
}

async function getLatestWDAVersion(): Promise<string> {
  // Scan the cache directory to find the latest version
  const wdaCacheDir = cachePath('wda');

  try {
    await access(wdaCacheDir, constants.F_OK);
  } catch {
    throw new Error('No WDA cache found. Please run setup_wda first.');
  }

  const entries = await readdir(wdaCacheDir);
  const versions = await Promise.all(
    entries.map(async dir => {
      const dirPath = path.join(wdaCacheDir, dir);
      const stats = await stat(dirPath);
      return stats.isDirectory() ? dir : null;
    })
  );

  const filteredVersions = versions
    .filter((v): v is string => v !== null)
    .sort((a, b) => {
      // Simple version comparison - you might want to use semver for more complex versions
      return b.localeCompare(a, undefined, { numeric: true });
    });

  if (filteredVersions.length === 0) {
    throw new Error(
      'No WDA versions found in cache. Please run setup_wda first.'
    );
  }

  return filteredVersions[0];
}

async function getBootedSimulators(): Promise<string[]> {
  try {
    const { stdout } = await execAsync('xcrun simctl list devices --json');
    const data = JSON.parse(stdout);
    const bootedSimulators: string[] = [];

    for (const [runtime, devices] of Object.entries(data.devices)) {
      if (Array.isArray(devices)) {
        for (const device of devices as any[]) {
          if (device.state === 'Booted') {
            bootedSimulators.push(device.udid);
          }
        }
      }
    }

    return bootedSimulators;
  } catch (error) {
    throw new Error(`Failed to list simulators: ${error}`);
  }
}

async function installAppOnSimulator(
  appPath: string,
  simulatorUdid: string
): Promise<void> {
  try {
    await execAsync(`xcrun simctl install "${simulatorUdid}" "${appPath}"`);
  } catch (error) {
    throw new Error(
      `Failed to install app on simulator ${simulatorUdid}: ${error}`
    );
  }
}

async function launchAppOnSimulator(
  bundleId: string,
  simulatorUdid: string
): Promise<void> {
  try {
    await execAsync(`xcrun simctl launch "${simulatorUdid}" "${bundleId}"`);
  } catch (error) {
    throw new Error(
      `Failed to launch app on simulator ${simulatorUdid}: ${error}`
    );
  }
}

async function getAppBundleId(appPath: string): Promise<string> {
  try {
    const { stdout } = await execAsync(
      `/usr/libexec/PlistBuddy -c "Print CFBundleIdentifier" "${path.join(appPath, 'Info.plist')}"`
    );
    return stdout.trim();
  } catch (error) {
    throw new Error(`Failed to get bundle ID for app at ${appPath}: ${error}`);
  }
}

async function isWDAInstalled(simulatorUdid: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      `xcrun simctl listapps "${simulatorUdid}" --json`
    );
    const data = JSON.parse(stdout);

    // Check if any app has a bundle ID that looks like WDA
    for (const [bundleId, appInfo] of Object.entries(data)) {
      if (
        bundleId.includes('WebDriverAgentRunner') ||
        (appInfo as any)?.CFBundleName?.includes('WebDriverAgent')
      ) {
        return true;
      }
    }
    return false;
  } catch (error) {
    // If we can't check, assume it's not installed
    return false;
  }
}

async function isWDARunning(simulatorUdid: string): Promise<boolean> {
  try {
    const { stdout } = await execAsync(
      `xcrun simctl listapps "${simulatorUdid}" --json`
    );
    const data = JSON.parse(stdout);

    // Check if WDA is running
    for (const [bundleId, appInfo] of Object.entries(data)) {
      if (
        bundleId.includes('WebDriverAgentRunner') &&
        (appInfo as any)?.ApplicationType === 'User'
      ) {
        return true;
      }
    }
    return false;
  } catch (error) {
    return false;
  }
}

export default function installWDA(server: any): void {
  server.addTool({
    name: 'install_wda',
    description: `Install and launch the WebDriverAgent (WDA) app on a booted iOS simulator using the app path from setup_wda.
      This tool requires WDA to be already set up using setup_wda and at least one simulator to be booted.
      `,
    parameters: z.object({
      simulatorUdid: z
        .string()
        .optional()
        .describe(
          'The UDID of the simulator to install WDA on. If not provided, will use the first booted simulator found.'
        ),
      appPath: z
        .string()
        .optional()
        .describe(
          `The path to the WDA app bundle (.app file) that be generated by setup_wda tool.
          If not provided, will try to find the latest cached WDA app.`
        ),
    }),
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
    },
    execute: async (args: any, context: any): Promise<any> => {
      try {
        const { simulatorUdid, appPath: providedAppPath } = args;

        // Verify it's a macOS system
        if (process.platform !== 'darwin') {
          throw new Error(
            'WDA installation is only supported on macOS systems'
          );
        }

        // Determine WDA app path
        let appPath: string;
        if (providedAppPath) {
          appPath = providedAppPath;
        } else {
          // Try to find the latest cached WDA app
          const version = await getLatestWDAVersion();
          const extractDir = cachePath(`wda/${version}/extracted`);
          appPath = path.join(extractDir, 'WebDriverAgentRunner-Runner.app');
        }

        // Verify WDA app exists
        try {
          await access(appPath, constants.F_OK);
        } catch {
          throw new Error(
            `WDA app not found at ${appPath}. Please run setup_wda first to download and cache WDA, or provide a valid appPath.`
          );
        }

        // Get booted simulators
        const bootedSimulators = await getBootedSimulators();
        if (bootedSimulators.length === 0) {
          throw new Error(
            'No booted simulators found. Please boot a simulator first using boot_simulator tool.'
          );
        }

        // Determine target simulator
        const targetSimulator = simulatorUdid || bootedSimulators[0];

        if (!bootedSimulators.includes(targetSimulator)) {
          throw new Error(
            `Simulator ${targetSimulator} is not booted. Available booted simulators: ${bootedSimulators.join(', ')}`
          );
        }

        console.log(
          `Installing WDA from ${appPath} on simulator ${targetSimulator}...`
        );

        // Check if WDA is already installed and running
        const isInstalled = await isWDAInstalled(targetSimulator);
        const isRunning = await isWDARunning(targetSimulator);

        if (isRunning) {
          return {
            content: [
              {
                type: 'text',
                text: `✅ WebDriverAgent is already running on simulator ${targetSimulator}!\n\nSimulator: ${targetSimulator}\nApp Path: ${appPath}\nStatus: Running\n\n🚀 WDA is ready to accept connections from Appium.`,
              },
            ],
          };
        }

        // Install the app (only if not already installed)
        if (!isInstalled) {
          await installAppOnSimulator(appPath, targetSimulator);
          console.log('WDA app installed successfully');
        } else {
          console.log('WDA app already installed, skipping installation');
        }

        // Get bundle ID and launch the app
        const bundleId = await getAppBundleId(appPath);
        console.log(`Launching WDA with bundle ID: ${bundleId}`);
        await launchAppOnSimulator(bundleId, targetSimulator);

        return {
          content: [
            {
              type: 'text',
              text: `✅ WebDriverAgent installed and launched successfully!\n\nSimulator: ${targetSimulator}\nBundle ID: ${bundleId}\nApp Path: ${appPath}\nInstallation: ${isInstalled ? 'Skipped (already installed)' : 'Completed'}\n\n🚀 WDA is now running on the simulator and ready to accept connections from Appium.\n\nNote: The WDA app should be visible on the simulator screen. You can now create an Appium session.`,
            },
          ],
        };
      } catch (error: any) {
        console.error('Error installing WDA:', error);
        throw new Error(`Failed to install WebDriverAgent: ${error.message}`);
      }
    },
  });
}
