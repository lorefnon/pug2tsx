export enum ErrorCode {
    FileTypeError = "FileTypeError",
    PugParseError = "PugParseError",
    IncorrectSyntaxError = "IncorrectSyntaxError",
    UnsupportedSyntaxError = "UnsupportedSyntaxError",
    GenerationError = "GenerationError",
    UnknownProcessingError = "UnknownProcessingError",
}

export interface CompilationError<CodeT extends ErrorCode = ErrorCode> {
    code: CodeT;
    reasons?: string[];
    line?: number;
    column?: number;
    maybeBug?: boolean;
    isFatal: boolean;
    originalError?: unknown;
}
