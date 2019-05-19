// @ts-ignore
import { Lexer as PugLexer } from "pug-lexer";

export class Lexer extends PugLexer {
    // This is primarily overriden to prevent expression checks of buffered code blocks
    // The expression check is not typescript compatible and is undesirable when buffered
    // code blocks have attached body (in case of render blocks)
    isExpression() {
        return true;
    }
}

export function lex(str: any, options: any) {
    // @ts-ignore
    var lexer = new Lexer(str, options);
    return JSON.parse(JSON.stringify(lexer.getTokens()));
}
