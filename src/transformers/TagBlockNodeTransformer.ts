import * as Pug from "../pug";
import * as t from "@babel/types";
import { Transformer } from "./Transformer";
import { NodeChildrenTransformer } from "./NodeChildrenTransformer";

export class TagBlockNodeTransformer extends Transformer<
    Pug.BlockNode,
    (t.JSXText | t.JSXExpressionContainer | t.JSXSpreadChild | t.JSXElement | t.JSXFragment)[]
> {
    transform(): void {
        this.delegateOutputTo(NodeChildrenTransformer, this.input.nodes || []);
    }
}
