import _glob from "glob";
import fs from "fs-extra";
import path from "path";
import { promisify } from "util";

const glob = promisify(_glob);

export const forEachDirEntry = async (
    inputDir: string,
    callback: (filePath: string) => Promise<void>,
): Promise<void> => {
    if (!path.isAbsolute(inputDir)) inputDir = path.resolve(inputDir);
    const entries = await fs.readdir(inputDir);
    await Promise.all(
        entries.map(async entry => {
            const entryPath = path.join(inputDir, entry);
            const stat = await fs.stat(entryPath);
            if (stat.isDirectory()) {
                await forEachDirEntry(entryPath, callback);
            } else if (stat.isFile()) {
                await callback(entryPath);
            }
        }),
    );
};

export const forEachGlobMatch = async (
    patterns: string[],
    callback: (filePath: string) => Promise<void>,
): Promise<void> => {
    await Promise.all(
        patterns.map(async pattern => {
            const filePaths = await glob(pattern);
            await Promise.all(filePaths.map(callback));
        }),
    );
};
