import { Maybe } from "../util-types";
import { FileTransformationContext } from "./FileTransformationContext";
import { CompilationError } from "../CompilationError";

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
