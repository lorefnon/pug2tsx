import * as t from "@babel/types";
import * as Pug from "../pug";
import { Transformer } from "./Transformer";
import { parse, parseExpression } from "@babel/parser";
import { ErrorCode } from "../CompilationError";
import { isEmpty } from "lodash";

export class ScriptNodeTransformer extends Transformer<Pug.TagNode, t.Node[]> {
    public isExpression = false;
    transform(): void {
        let parsed: t.Node[];
        const parseOpts = {
            sourceType: "module" as "module",
            plugins: ["typescript" as "typescript"],
        };
        let content = '';
        if (Pug.isType<Pug.CodeNode>(this.input, Pug.Type.Code)) {
            content = this.input.val;
        } else if (Pug.isType<Pug.TagNode>(this.input, Pug.Type.Tag)) {
            if (this.input.block) {
                for (const member of this.input.block.nodes) {
                    if (!Pug.isType<Pug.TextNode>(member, Pug.Type.Text)) {
                        this.pushError({
                            code: ErrorCode.IncorrectSyntaxError,
                            reasons: [`Expected text node but found node of type: ${member.type}`],
                            isFatal: true,
                            maybeBug: false
                        });
                        return;
                    }
                    content += member.val + '\n';
                }
            }
        }
        if (isEmpty(content)) {
            this.output = [];
            return;
        }
        try {
            if (this.isExpression) {
                parsed = [parseExpression(content, parseOpts)];
            } else {
                parsed = parse(content, parseOpts).program.body;
            }
            this.output = parsed;
        } catch (e) {
            this.pushError({
                code: ErrorCode.IncorrectSyntaxError,
                isFatal: true,
                maybeBug: false,
                originalError: e,
                ...Pug.extractPosInfo(this.input),
            });
        }
    }
}
