import * as Pug from "../pug";
import * as t from "@babel/types";
import { Transformer } from "./Transformer";
import { partition } from "lodash";
import { parseExpression } from "@babel/parser";
import { TagBlockNodeTransformer } from "./TagBlockNodeTransformer";
import { ErrorCode } from "../CompilationError";
import { isBoolean } from "util";

export class TagNodeTransformer extends Transformer<Pug.TagNode, t.Node> {
    transform(): void {
        const node = this.input;
        try {
            const [classNameAttrs, otherAttrs] = partition(
                node.attrs || [],
                a => a.name === "class" || a.name === "className",
            );
            const attrs = otherAttrs.map((a: Pug.Attr) => {
                let val;
                if (isBoolean(a.val)) {
                    val = t.booleanLiteral(a.val);
                } else {
                    val = parseExpression(a.val);
                }
                if (a.name.match(/^[a-z0-9_-]+$/i)) {
                    return t.jsxAttribute(t.jsxIdentifier(a.name), t.jsxExpressionContainer(val));
                } else {
                    return t.jsxSpreadAttribute(
                        t.objectExpression([t.objectProperty(t.stringLiteral(a.name), val, undefined, false)]),
                    );
                }
            });
            if (classNameAttrs.length === 1) {
                attrs.push(
                    t.jsxAttribute(
                        t.jsxIdentifier("className"),
                        t.jsxExpressionContainer(parseExpression(classNameAttrs[0].val as any)),
                    ),
                );
            } else if (classNameAttrs.length > 1) {
                attrs.push(
                    t.jsxAttribute(
                        t.jsxIdentifier("className"),
                        t.jsxExpressionContainer(
                            t.callExpression(
                                t.memberExpression(
                                    t.arrayExpression(classNameAttrs.map(a => parseExpression(a.val as any))),
                                    t.identifier("join"),
                                ),
                                [t.stringLiteral(" ")],
                            ),
                        ),
                    ),
                );
            }
            let children: Array<
                t.JSXText | t.JSXExpressionContainer | t.JSXSpreadChild | t.JSXElement | t.JSXFragment
            > = [];
            if (!node.selfClosing && node.block) {
                const result = this.delegateTo(TagBlockNodeTransformer, node.block);
                if (result) children = result;
            }
            this.output = t.jsxElement(
                t.jsxOpeningElement(t.jsxIdentifier(node.name), attrs, false),
                t.jsxClosingElement(t.jsxIdentifier(node.name)),
                children,
                false,
            );
        } catch (e) {
            // TODO Improve this
            this.pushError({
                code: ErrorCode.IncorrectSyntaxError,
                maybeBug: false,
                isFatal: false,
                column: node.column,
                line: node.line,
            });
        }
    }
}
