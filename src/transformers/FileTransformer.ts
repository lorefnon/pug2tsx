import generateJS from '@babel/generator';
import * as t from "@babel/types";
import prettier from 'prettier';
// @ts-ignore
import pugLexer from 'pug-lexer';
// @ts-ignore
import pugParser from 'pug-parser';

import * as Pug from '../pug';
import { PugASTTransformer } from './PugASTTransformer';
import { Transformer } from './Transformer';
import { ErrorCode } from '../CompilationError';

export const parsePug = (input: string, context: {filePath?: string} = {}) => {
    const tokens = pugLexer(input, { filename: context.filePath });
    return pugParser(tokens, { filename: context.filePath, src: input });
}

export class FileTransfomer extends Transformer<string, string> {
    transform() {
        const ast = this.parseAST();
        if (!ast) return;
        const transformer = new PugASTTransformer(ast, this.context);
        transformer.transform();
        const statements = transformer.output;
        if (!statements) return;
        this.output = this.serialize(statements);
    }
    parseAST() {
        let ast;
        try {
            ast = parsePug(this.input, this.context);
        } catch (e) {
            this.pushError({
                code: ErrorCode.PugParseError,
                originalError: e,
                reasons: ["Failed to parse Pug Template"],
                isFatal: true,
            });
            return;
        }
        if (!Pug.isType<Pug.BlockNode>(ast, Pug.Type.Block)) {
            this.pushError({
                code: ErrorCode.UnsupportedSyntaxError,
                reasons: ["Expected top level to be a block"],
                column: 1,
                line: 1,
                isFatal: true,
            });
            return;
        }
        return ast;
    }
    serialize(statements: t.Statement[]) {
        let result: string;
        try {
            result = statements.map(n => generateJS(n).code).join("\n\n");
        } catch (e) {
            this.pushError({
                code: ErrorCode.GenerationError,
                reasons: ["Failed to generate javascript from transformed AST"],
                maybeBug: true,
                originalError: e,
                isFatal: true,
            });
            return;
        }
        try {
            result = prettier.format(result);
        } catch (e) {
            this.pushError({
                code: ErrorCode.GenerationError,
                reasons: ["Failed to prettify generated javascript"],
                isFatal: false,
            });
        }
        return result;
    }
}
