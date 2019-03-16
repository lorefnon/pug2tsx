import * as t from "@babel/types";
import * as path from "path";
import { some, upperFirst, capitalize } from "lodash";
import { Maybe } from "../util-types";
import { CompilationError } from "../CompilationError";

export class FileTransformationContext<ErrT = CompilationError> {
    public topLevelStatements: t.Statement[] = [
        t.importDeclaration([t.importNamespaceSpecifier(t.identifier("React"))], t.stringLiteral("react")),
    ];
    public errors: ErrT[] = [];

    constructor(public filePath?: string, public _defaultExportName?: string) {}

    shouldGenerate() {
        return !some(this.errors, { isFatal: true });
    }

    get defaultExportName(): Maybe<string> {
        if (this._defaultExportName) return this._defaultExportName;
        if (this.filePath) {
            const fileName = path.basename(this.filePath);
            return upperFirst(capitalize(fileName.split(".")[0]!));
        }
    }
}
