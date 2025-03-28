import { spawn } from 'child_process';
import { YT_DLP_PATH } from '../services/transcription';

export async function extractVideoTitle(url: string): Promise<string | null> {
  return new Promise<string | null>((resolve) => {
    const ytDlp = spawn(YT_DLP_PATH!, [
      url,
      '--get-title',
      '--no-playlist'
    ]);

    let title = '';
    let errorOutput = '';

    ytDlp.stdout.on('data', (data) => {
      title += data.toString().trim();
    });

    ytDlp.stderr.on('data', (data) => {
      errorOutput += data.toString();
    });

    ytDlp.on('close', (code) => {
      if (code !== 0) {
        console.error('Failed to get video title:', errorOutput);
        resolve(null);
      } else {
        resolve(title || null);
      }
    });

    ytDlp.on('error', (error) => {
      console.error('Error getting video title:', error);
      resolve(null);
    });
  });
}
