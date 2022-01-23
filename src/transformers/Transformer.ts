import { Maybe } from "../util-types";
import { FileTransformationContext } from "./FileTransformationContext";
import { CompilationError } from "../CompilationError";
import * as t from "@babel/types"
import * as Pug from "../pug"

export abstract class Transformer<InputT, OutputT, ErrT = CompilationError> {
    public output: Maybe<OutputT>;
    public errors: ErrT[] = [];
    constructor(protected input: InputT, protected context: FileTransformationContext<ErrT>) {}
    abstract transform(): void;

    delegateTo<LocalInputT, LocalOutputT>(Ctor: TransformerCtor<LocalInputT, LocalOutputT, ErrT>, input: LocalInputT) {
        const transformer = new Ctor(input, this.context);
        transformer.transform();
        return transformer.output;
    }

    commentLineNumber(targetNode: t.Node, sourceNode: Pug.Node) {
        if (this.context.skipLineAnnotations) return;
        t.addComment(targetNode, "leading", `@pug:L${sourceNode.line}`);
    }

    delegateOutputTo<LocalInputT>(Ctor: TransformerCtor<LocalInputT, OutputT, ErrT>, input: LocalInputT) {
        this.output = this.delegateTo(Ctor, input);
    }

    pushError(error: ErrT) {
        this.context.errors.push(error);
    }
}

export interface TransformerCtor<InputT, OutputT, ErrT = CompilationError> {
    new (input: InputT, context: FileTransformationContext<ErrT>): Transformer<InputT, OutputT, ErrT>;
}
