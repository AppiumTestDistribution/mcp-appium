/**
 * Tool to upload mobile apps to LambdaTest cloud storage
 */
import { z } from 'zod';
import fs from 'fs';
import path from 'path';

export default function uploadApp(server: any): void {
  server.addTool({
    name: 'upload_app_lambdatest',
    description:
      'Upload a mobile app (APK/IPA) to LambdaTest cloud storage for testing',
    parameters: z.object({
      appPath: z
        .string()
        .describe(
          'Local path to the mobile app file (APK for Android, IPA for iOS)'
        ),
      appName: z
        .string()
        .optional()
        .describe('Custom name for the app (default: filename)'),
    }),
    annotations: {
      readOnlyHint: false,
      openWorldHint: false,
    },
    execute: async (args: any, context: any): Promise<any> => {
      try {
        const { appPath, appName } = args;

        // Get LambdaTest credentials
        const ltUsername = process.env.LT_USERNAME;
        const ltAccessKey = process.env.LT_ACCESS_KEY;

        // Validate file exists
        if (!fs.existsSync(appPath)) {
          throw new Error(`App file not found at path: ${appPath}`);
        }

        // Get file info
        const fileName = path.basename(appPath);
        const fileExtension = path.extname(appPath).toLowerCase();
        const finalAppName = appName || fileName;

        // Validate file type
        if (!['.apk', '.ipa'].includes(fileExtension)) {
          throw new Error(
            `Unsupported file type: ${fileExtension}. Only .apk and .ipa files are supported.`
          );
        }

        console.log(`Uploading app: ${fileName} to LambdaTest...`);

        // Read file as buffer
        const fileBuffer = fs.readFileSync(appPath);

        // Create form data boundary
        const boundary = `----formdata-jarvis-${Date.now()}`;

        // Create multipart form data
        const formData = [
          `--${boundary}`,
          'Content-Disposition: form-data; name="name"',
          '',
          finalAppName,
          `--${boundary}`,
          `Content-Disposition: form-data; name="appFile"; filename="${fileName}"`,
          `Content-Type: application/${fileExtension === '.apk' ? 'vnd.android.package-archive' : 'octet-stream'}`,
          '',
        ].join('\r\n');

        const endBoundary = `\r\n--${boundary}--\r\n`;

        // Combine form data with file buffer
        const body = Buffer.concat([
          Buffer.from(formData, 'utf8'),
          fileBuffer,
          Buffer.from(endBoundary, 'utf8'),
        ]);

        // Upload to LambdaTest
        const response = await fetch(
          'https://manual-api.lambdatest.com/app/upload/realDevice',
          {
            method: 'POST',
            headers: {
              Authorization: `Basic ${Buffer.from(`${ltUsername}:${ltAccessKey}`).toString('base64')}`,
              'Content-Type': `multipart/form-data; boundary=${boundary}`,
              'Content-Length': body.length.toString(),
            },
            body: body,
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(
            `Upload failed with status ${response.status}: ${errorText}`
          );
        }

        const result = await response.json();

        if (result.error) {
          throw new Error(`Upload failed: ${result.error}`);
        }

        const appUrl = result.app_url;
        const appId = appUrl.split('//')[1]; // Extract app ID from lt://APP_ID format

        console.log(`App uploaded successfully! App URL: ${appUrl}`);

        return {
          content: [
            {
              type: 'text',
              text: `App uploaded successfully to LambdaTest!

Upload Details:
- App Name: ${finalAppName}
- File: ${fileName}
- App URL: ${appUrl}
- App ID: ${appId}

You can now use this app URL (${appUrl}) in the 'app' parameter when creating a LambdaTest session with create_lambdatest_session tool.

Example usage:
create_lambdatest_session({
  platform: "${fileExtension === '.apk' ? 'android' : 'ios'}",
  deviceName: "Galaxy S21", // or iPhone device
  platformVersion: "11.0", // or iOS version
  app: "${appUrl}"
})`,
            },
          ],
        };
      } catch (error: any) {
        console.error('Error uploading app to LambdaTest:', error);

        let errorMessage = `Failed to upload app: ${error.message}`;

        if (error.message.includes('ENOENT')) {
          errorMessage +=
            '\n\nTip: Check that the file path is correct and the file exists.';
        } else if (
          error.message.includes('401') ||
          error.message.includes('authentication')
        ) {
          errorMessage +=
            '\n\nTip: Check your LambdaTest credentials. You can find them at: https://accounts.lambdatest.com/security';
        } else if (
          error.message.includes('413') ||
          error.message.includes('too large')
        ) {
          errorMessage +=
            '\n\nTip: The app file might be too large. LambdaTest has file size limits for app uploads.';
        }

        throw new Error(errorMessage);
      }
    },
  });
}
