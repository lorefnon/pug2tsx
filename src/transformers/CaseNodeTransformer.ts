import * as Pug from "../pug";
import * as t from "@babel/types";
import { Transformer } from "./Transformer";
import { compact, flatten } from "lodash";
import { parseExpression } from "@babel/parser";
import { ErrorCode } from "../CompilationError";
import { FunctionBodyTransformer } from "./FunctionBodyTransformer";
import { PugNodeTransformer } from "./PugNodeTransformer";

export class CaseNodeTransformer extends Transformer<Pug.CaseNode, t.Node> {
    transform(): void {
        try {
            this.output = t.callExpression(
                t.arrowFunctionExpression([], t.blockStatement([
                    t.switchStatement(parseExpression(this.input.expr), compact(this.input.block.nodes.map(n => {
                        if (!Pug.isType<Pug.WhenNode>(n, Pug.Type.When)) {
                            this.pushError({
                                reasons: ['Expected only when node in case statement body'],
                                isFatal: true,
                                code: ErrorCode.UnsupportedSyntaxError
                            });
                            return;
                        }
                        const transformed = flatten(compact(n.block.nodes.map(n => this.delegateTo(PugNodeTransformer, n))));
                        const body = this.delegateTo(FunctionBodyTransformer, transformed);
                        if (!body) return;
                        if (n.expr === 'default') return t.switchCase(null, body);
                        else return t.switchCase(parseExpression(n.expr), body);
                    })))
                ])),
                []
            )
        } catch (e) {
            this.pushError({
                code: ErrorCode.UnsupportedSyntaxError,
                originalError: e,
                isFatal: true
            })
        }
    }
}