#!/usr/bin/env node
import fs from "fs-extra";
import _glob from "glob";
import { isEmpty, some, includes } from "lodash";
import parseArgs from "minimist";
import path from "path";
import { promisify } from "util";

import { transpile } from "./compiler";
import { forEachDirEntry } from "./fs-utils";

const glob = promisify(_glob);

const argv = parseArgs(process.argv.slice(2), {
    string: ["input-dir", "output-dir"],
    boolean: ["help"],
    alias: {
        "input-dir": ["i"],
        "output-dir": ["o"],
    },
});

const outputDir = argv["output-dir"] || argv["input-dir"];

const showHelp = async () =>
    console.log(await fs.readFile(path.join(__dirname, "../docs/help-info.txt"), { encoding: "utf-8" }));

const transpileFile = (options: { outputDir: string; inputDir: string }) => async (filePath: string) => {
    const ext = path.extname(filePath);
    if (!includes([".pug", ".jade"], ext)) return;
    const destFilePath = path.join(
        options.outputDir,
        path.relative(options.inputDir, filePath.replace(path.extname(filePath), ".tsx")),
    );
    const inputContent = (await fs.readFile(filePath)).toString();
    const transpileR = await transpile(inputContent, { filePath });
    if (transpileR.errors) {
        for (const error of transpileR.errors) {
            let msg = `Encountered error in file: ${filePath}`;
            if (error.line) {
                msg += ` (line: ${error.line}`;
                if (error.column) {
                    msg += `, column: ${error.column}`;
                }
                msg += ")";
            }
            msg += ` [CODE: ${error.code}]`;
            if (error.reasons) {
                msg += ` ${error.reasons.join("\n")}`;
            }
            console.error(msg);
            if (error.maybeBug) {
                console.error(`This may be a bug in pug2tsx. We encourage you to create an issue for this.`);
            }
        }
    }
    if (some(transpileR.errors, { isFatal: true })) {
        console.error(
            `Failed to generate output for file ${filePath} because of one or more of the errors listed above`,
        );
    } else {
        await fs.ensureDir(path.dirname(destFilePath));
        await fs.writeFile(destFilePath, transpileR.result);
    }
};

const run = async () => {
    try {
        if (argv.help) {
            await showHelp();
        } else if (argv["input-dir"]) {
            if (!isEmpty(argv._)) {
                console.error("When input-dir is specified, input files can not be passed");
                process.exit(1);
            }
            await forEachDirEntry(argv["input-dir"], transpileFile({ outputDir, inputDir: argv["input-dir"] }));
        } else {
            await showHelp();
        }
        process.exit(0);
    } catch (e) {
        console.error(e);
        process.exit(1);
    }
};

run();
