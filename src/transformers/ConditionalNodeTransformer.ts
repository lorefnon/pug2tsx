import { parseExpression } from "@babel/parser";
import * as t from "@babel/types";

import { ErrorCode } from "../CompilationError";
import * as Pug from "../pug";
import { Transformer } from "./Transformer";
import { NodeChildTransformer } from "./NodeChildTransformer";

export class ConditionalNodeTransformer extends Transformer<Pug.ConditionalNode, t.Node> {
    transform(): void {
        try {
            this.output = t.conditionalExpression(
                parseExpression(this.input.test),
                this.delegateTo(NodeChildTransformer, this.input.consequent) || t.identifier("undefined"),
                (this.input.alternate && this.delegateTo(NodeChildTransformer, this.input.alternate)) ||
                    t.identifier("undefined"),
            );
        } catch (e) {
            this.pushError({
                code: ErrorCode.UnsupportedSyntaxError,
                originalError: e,
                isFatal: true,
            });
        }
    }
}
