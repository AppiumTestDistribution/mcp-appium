/**
 * Tool to download and setup WebDriverAgent (WDA) for iOS simulators
 */
import { z } from 'zod';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs';
import os from 'os';
import https from 'https';

const execAsync = promisify(exec);

function cachePath(folder: string): string {
  return path.join(os.homedir(), '.cache', 'appium-mcp', folder);
}

async function getLatestWDAVersion(): Promise<string> {
  return new Promise((resolve, reject) => {
    const options = {
      hostname: 'api.github.com',
      path: '/repos/appium/WebDriverAgent/releases/latest',
      method: 'GET',
      headers: {
        'User-Agent': 'mcp-appium',
        Accept: 'application/vnd.github.v3+json',
      },
    };

    https
      .get(options, response => {
        let data = '';

        response.on('data', chunk => {
          data += chunk;
        });

        response.on('end', () => {
          try {
            const release = JSON.parse(data);
            if (release.tag_name) {
              const version = release.tag_name.replace(/^v/, '');
              resolve(version);
            } else {
              reject(new Error('No tag_name found in release data'));
            }
          } catch (error) {
            reject(error);
          }
        });
      })
      .on('error', err => {
        reject(err);
      });
  });
}

async function downloadFile(url: string, destPath: string): Promise<void> {
  return new Promise((resolve, reject) => {
    const file = fs.createWriteStream(destPath);

    https
      .get(url, response => {
        if (response.statusCode === 302 || response.statusCode === 301) {
          file.close();
          fs.unlinkSync(destPath);
          return downloadFile(response.headers.location!, destPath)
            .then(resolve)
            .catch(reject);
        }

        if (response.statusCode !== 200) {
          file.close();
          fs.unlinkSync(destPath);
          return reject(
            new Error(`Failed to download: ${response.statusCode}`)
          );
        }

        response.pipe(file);

        file.on('finish', () => {
          file.close();
          resolve();
        });
      })
      .on('error', err => {
        file.close();
        if (fs.existsSync(destPath)) {
          fs.unlinkSync(destPath);
        }
        reject(err);
      });
  });
}

async function unzipFile(zipPath: string, destDir: string): Promise<void> {
  await execAsync(`unzip -q "${zipPath}" -d "${destDir}"`);
}

export default function setupWDA(server: any): void {
  server.addTool({
    name: 'setup_wda',
    description:
      'Download and setup prebuilt WebDriverAgent (WDA) for iOS/tvOS simulators only (not for real devices). This significantly speeds up the first Appium session by avoiding the need to build WDA from source. Downloads the latest version from GitHub and caches it locally.',
    parameters: z.object({
      platform: z
        .enum(['ios', 'tvos'])
        .optional()
        .default('ios')
        .describe(
          'The simulator platform to download WDA for. Default is "ios". Use "tvos" for Apple TV simulators. Note: This tool only works with simulators, not real devices.'
        ),
    }),
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
    },
    execute: async (args: any, context: any): Promise<any> => {
      try {
        const { platform = 'ios' } = args;

        // Verify it's a macOS system
        if (process.platform !== 'darwin') {
          throw new Error(
            'WebDriverAgent setup is only supported on macOS systems'
          );
        }

        // Get the architecture
        const arch = os.arch();
        const archStr = arch === 'arm64' ? 'arm64' : 'x86_64';

        // Fetch latest WDA version from GitHub
        const wdaVersion = await getLatestWDAVersion();

        // Create cache directory structure
        const versionCacheDir = cachePath(`wda/${wdaVersion}`);
        const extractDir = path.join(versionCacheDir, 'extracted');
        const zipPath = path.join(
          versionCacheDir,
          'WebDriverAgentRunner-Runner.zip'
        );
        const appPath = path.join(
          extractDir,
          'WebDriverAgentRunner-Runner.app'
        );

        // Check if this version is already cached
        if (fs.existsSync(appPath)) {
          return {
            content: [
              {
                type: 'text',
                text: `✅ WebDriverAgent is already set up!\n\nVersion: ${wdaVersion}\nPlatform: ${platform} (simulator only)\nArchitecture: ${archStr}\nLocation: ${appPath}\nCache: ~/.cache/appium-mcp/wda/${wdaVersion}\n\n🚀 You can now create an Appium session without needing to build WDA from source.`,
              },
            ],
          };
        }

        // Version not cached, download it
        const startTime = Date.now();

        // Create cache directories
        fs.mkdirSync(versionCacheDir, { recursive: true });
        fs.mkdirSync(extractDir, { recursive: true });

        // Download URL
        const downloadUrl = `https://github.com/appium/WebDriverAgent/releases/download/v${wdaVersion}/WebDriverAgentRunner-Runner.zip`;

        console.log(
          `Downloading prebuilt WDA v${wdaVersion} for ${platform} simulator...`
        );

        await downloadFile(downloadUrl, zipPath);

        console.log('Extracting WebDriverAgent...');
        await unzipFile(zipPath, extractDir);

        const duration = ((Date.now() - startTime) / 1000).toFixed(1);

        // Verify extraction
        if (!fs.existsSync(appPath)) {
          throw new Error(
            'WebDriverAgent extraction failed - app bundle not found'
          );
        }

        return {
          content: [
            {
              type: 'text',
              text: `✅ WebDriverAgent downloaded and set up successfully!\n\nVersion: ${wdaVersion}\nPlatform: ${platform} (simulator only)\nArchitecture: ${archStr}\nLocation: ${appPath}\nCache: ~/.cache/appium-mcp/wda/${wdaVersion}\nDownload Time: ${duration} seconds\n\n🚀 WDA is now ready! Your next Appium session will start much faster without needing to build WDA from source.\n\nNote: This cached version will be reused on subsequent runs.`,
            },
          ],
        };
      } catch (error: any) {
        console.error('Error setting up WDA:', error);
        throw new Error(`Failed to setup WebDriverAgent: ${error.message}`);
      }
    },
  });
}
