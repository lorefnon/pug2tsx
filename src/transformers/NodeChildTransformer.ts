import * as Pug from "../pug";
import * as t from "@babel/types";
import { Transformer } from "./Transformer";
import { TagBlockNodeTransformer } from "./TagBlockNodeTransformer";
import { NodeChildrenTransformer } from "./NodeChildrenTransformer";

export type JSXChild = (t.JSXText | t.JSXExpressionContainer | t.JSXSpreadChild | t.JSXElement | t.JSXFragment);
export type JSXNode = (t.JSXElement | t.JSXFragment);

export class NodeChildTransformer extends Transformer<
    Pug.Node,
    JSXNode
> {
    transform(): void {
        let nodes: JSXChild[] = [];
        if (Pug.isType<Pug.BlockNode>(this.input, Pug.Type.Block)) {
            nodes = this.delegateTo(TagBlockNodeTransformer, this.input) || nodes;
        } else {
            nodes = this.delegateTo(NodeChildrenTransformer, [this.input]) || nodes;
        }
        if (nodes.length === 1) {
            const firstNode = nodes[0];
            if (t.isJSXFragment(firstNode) || t.isJSXElement(firstNode)) {
                this.output = firstNode;
            }
        }
        this.output = this.output || t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), nodes);
    }
}
