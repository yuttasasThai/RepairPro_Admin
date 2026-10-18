import JSZip from 'jszip';
import { PROJECT_SOURCE_FILES } from '../data/projectSourceCode';

/**
 * Generates and downloads the full project ZIP directly in the browser.
 * This runs 100% on the client side using Blobs, avoiding any 403 Forbidden
 * or server proxy issues from Google Cloud Run / hosting environment.
 */
export async function downloadProjectZip(): Promise<boolean> {
  try {
    const zip = new JSZip();

    // Add all project files into the zip archive
    for (const [filePath, content] of Object.entries(PROJECT_SOURCE_FILES)) {
      zip.file(filePath, content);
    }

    // Generate the ZIP blob in memory
    const blob = await zip.generateAsync({
      type: 'blob',
      compression: 'DEFLATE',
      compressionOptions: { level: 6 }
    });

    // Create object URL and trigger download
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = 'repair-pro-source-code.zip';
    document.body.appendChild(link);
    link.click();

    // Clean up
    setTimeout(() => {
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    }, 1000);

    return true;
  } catch (error) {
    console.error('Failed to generate project zip:', error);
    return false;
  }
}
