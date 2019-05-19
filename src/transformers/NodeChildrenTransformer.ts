import * as Pug from "../pug";
import * as t from "@babel/types";
import { Transformer } from "./Transformer";
import { PugNodeTransformer } from "./PugNodeTransformer";
import { FunctionBodyTransformer } from "./FunctionBodyTransformer";
import { flatten, compact } from "lodash";
import { JSXChild } from "./NodeChildTransformer";

// Transforms to children which can be embedded within JSX
export class NodeChildrenTransformer extends Transformer<Pug.Node[], JSXChild[]> {
    transform(): void {
        this.output = [];
        const transformedNodes = flatten(compact(this.input.map(n => this.delegateTo(PugNodeTransformer, n))));
        for (let i = 0; i < transformedNodes.length; i++) {
            const childNode = transformedNodes[i];
            if (t.isJSXElement(childNode) || t.isJSXText(childNode)) this.output.push(childNode);
            else if (t.isExpression(childNode) || t.isIdentifier(childNode))
                this.output.push(t.jsxExpressionContainer(childNode));
            else {
                this.output.push(
                    t.jsxExpressionContainer(
                        t.callExpression(
                            t.arrowFunctionExpression(
                                [],
                                t.blockStatement(
                                    this.delegateTo(FunctionBodyTransformer, transformedNodes.slice(i)) || [],
                                ),
                            ),
                            [],
                        ),
                    ),
                );
                break;
            }
        }
    }
}
