import * as t from "@babel/types";

import { Transformer } from "./Transformer";
import { first } from "lodash";
import { ErrorCode } from "../CompilationError";

export class FunctionBodyTransformer extends Transformer<t.Node[], t.Statement[]> {
    transform(): void {
        let precedingStatements: t.Statement[] = [];
        let jsxElements: (t.JSXElement | t.JSXExpressionContainer | t.JSXText)[] = [];
        for (let i = 0; i < this.input.length; i++) {
            const node = this.input[i];
            if (t.isStatement(node)) {
                if (jsxElements.length === 0) {
                    precedingStatements.push(node);
                } else {
                    const bodyStatements: t.Statement[] = [];
                    const transformer = new FunctionBodyTransformer(this.input.slice(i), this.context);
                    transformer.transform();
                    if (transformer.output) bodyStatements.push(...transformer.output);
                    jsxElements.push(
                        t.jsxExpressionContainer(
                            t.callExpression(t.arrowFunctionExpression([], t.blockStatement(bodyStatements)), []),
                        ),
                    );
                    break;
                }
            } else if (t.isJSXElement(node) || t.isJSXText(node)) {
                jsxElements.push(node);
            } else if (t.isExpression(node)) {
                jsxElements.push(t.jsxExpressionContainer(node));
            } else {
                this.pushError({
                    code: ErrorCode.UnsupportedSyntaxError,
                    isFatal: false,
                    reasons: [`Encountered unexpected node of type ${node.type}`],
                });
            }
        }
        if (jsxElements.length === 0) this.output = precedingStatements;
        if (jsxElements.length === 1) {
            const soloEl = first(jsxElements)!;
            if (t.isJSXElement(soloEl)) this.output = [...precedingStatements, t.returnStatement(soloEl)];
        }
        this.output = this.output || [
            ...precedingStatements,
            t.returnStatement(t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), jsxElements)),
        ];
    }
}
