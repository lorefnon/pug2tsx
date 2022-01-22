import assert from "assert";

// @ts-ignore
import { Parser as PugParser } from "pug-parser";

export class Parser extends PugParser {
    // Primary reason for overriding this is to allow buffered code nodes to have child block
    // attached, which is helpful for render blocks
    parseCode(this: any, noBlock: true) {
        var tok = this.expect("code");
        assert(typeof tok.mustEscape === "boolean", "Please update to the newest version of pug-lexer.");
        var node: any = {
            type: "Code",
            val: tok.val,
            buffer: tok.buffer,
            mustEscape: tok.mustEscape !== false,
            isInline: !!noBlock,
            line: tok.loc.start.line,
            column: tok.loc.start.column,
            filename: this.filename,
        };
        // todo: why is this here?  It seems like a hacky workaround
        if (node.val.match(/^ *else/)) node.debug = false;

        if (noBlock) return node;

        var block;

        // handle block
        block = "indent" == this.peek().type;
        if (block) {
            //   if (tok.buffer) {
            //     this.error('BLOCK_IN_BUFFERED_CODE', 'Buffered code cannot have a block attached to it', this.peek());
            //   }
            node.block = this.block();
        }

        return node;
    }
}

export function parse(tokens: any[], options: any) {
    // @ts-ignore
    var parser: any = new Parser(tokens, options);
    var ast = parser.parse();
    return JSON.parse(JSON.stringify(ast));
}
