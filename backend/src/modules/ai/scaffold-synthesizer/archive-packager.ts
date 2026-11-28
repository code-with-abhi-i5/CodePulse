import archiver from 'archiver';
import { Writable } from 'stream';
import { GeneratedFile } from './code-generator';

export class ArchivePackager {
  /**
   * Packages a list of generated files into an in-memory zip archive.
   */
  public async packageZip(
    files: GeneratedFile[],
    readmeContent?: string,
  ): Promise<{ buffer: Buffer; base64: string; size: number }> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const output = new Writable({
        write(chunk, encoding, callback) {
          chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk));
          callback();
        },
      });

      const archive = archiver('zip', {
        zlib: { level: 9 }, // Maximum compression
      });

      output.on('finish', () => {
        const buffer = Buffer.concat(chunks);
        resolve({
          buffer,
          base64: buffer.toString('base64'),
          size: buffer.length,
        });
      });

      archive.on('error', (err) => {
        reject(err);
      });

      archive.pipe(output);

      // Append all generated files
      for (const file of files) {
        archive.append(file.content, { name: file.path });
      }

      // Append generated README.md if provided
      if (readmeContent) {
        archive.append(readmeContent, { name: 'README.md' });
      }

      archive.finalize();
    });
  }
}
