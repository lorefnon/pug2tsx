import { FileTransformationContext } from "./transformers/FileTransformationContext";
import { FileTransfomer } from "./transformers/FileTransformer";

export interface CompilationOptions {
    filePath?: string;
    skipLineAnnotations?: boolean
}

export const transpile = (inputContent: string, options: CompilationOptions = {}) => {
    const context = new FileTransformationContext(
        options.filePath,
        options.skipLineAnnotations
    );
    const transformer = new FileTransfomer(inputContent, context);
    transformer.transform();
    return {
        result: transformer.output,
        errors: context.errors,
    };
};
