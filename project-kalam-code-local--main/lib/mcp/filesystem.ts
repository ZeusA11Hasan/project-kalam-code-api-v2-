import fs from 'fs';
import path from 'path';

const DATA_DIR = path.resolve(process.cwd(), 'data/ncert_pdfs');

/**
 * Filesystem MCP
 * strictly reads only .pdf files from /data/ncert_pdfs/
 */
export const filesystemMcp = {
    readPDF: (filePath: string): Buffer => {
        // 1. Normalize and resolve absolute path
        const absolutePath = path.resolve(process.cwd(), filePath);

        // 2. Strict Security Checks
        const isNcert = absolutePath.startsWith(path.resolve(process.cwd(), 'data/ncert_pdfs'));
        const isGuide = absolutePath.startsWith(path.resolve(process.cwd(), 'data/guide_pdfs'));

        if (!isNcert && !isGuide) {
            throw new Error(`Security Violation: Accessed path outside approved data directories`);
        }

        if (!absolutePath.endsWith('.pdf')) {
            throw new Error('Security Violation: Only .pdf files are allowed');
        }

        if (!fs.existsSync(absolutePath)) {
            throw new Error(`File not found: ${filePath}`);
        }

        // 3. Read File
        return fs.readFileSync(absolutePath);
    }
};
