import * as t from "@babel/types";
import { some } from "lodash";
import { CompilationError } from "../CompilationError";

export class FileTransformationContext<ErrT = CompilationError> {
    public topLevelStatements: t.Statement[] = [];
    public errors: ErrT[] = [];

    constructor(
        public filePath?: string,
        public skipLineAnnotations?: boolean
    ) {}

    shouldGenerate() {
        return !some(this.errors, { isFatal: true });
    }
}
