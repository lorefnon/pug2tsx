import { Transformer } from "./Transformer";
import * as Pug from "../pug";
import * as t from "@babel/types";
import { compact, flatten } from "lodash";
import { TagNodeTransformer } from "./TagNodeTransformer";
import { ErrorCode } from "../CompilationError";
import { CaseNodeTransformer } from "./CaseNodeTransformer";
import { ConditionalNodeTransformer } from "./ConditionalNodeTransformer";
import { EachNodeTransformer } from "./EachNodeTransformer";
import { CodeNodeTransformer } from "./CodeNodeTransformer";

export class PugNodeTransformer extends Transformer<Pug.Node, t.Node[]> {
    public isTopLevel = false;
    transform(): void {
        const node = this.input;
        if (Pug.isType<Pug.TagNode>(node, Pug.Type.Tag)) {
            this.transformTagNode(node);
            return;
        }
        if (Pug.isType<Pug.BlockNode>(node, Pug.Type.Block)) {
            this.output = flatten(compact(node.nodes.map(n => this.delegateTo(PugNodeTransformer, n))));
            return;
        }
        if (Pug.isType<Pug.CodeNode>(node, Pug.Type.Code)) {
            this.transformCodeNode(node);
            return;
        }
        if (Pug.isType<Pug.TextNode>(node, Pug.Type.Text)) {
            this.output = [t.jsxText(node.val)];
            return;
        }
        if (Pug.isType<Pug.CaseNode>(node, Pug.Type.Case)) {
            const transformed = this.delegateTo(CaseNodeTransformer, node);
            if (transformed) this.output = [transformed];
            return;
        }
        if (Pug.isType<Pug.ConditionalNode>(node, Pug.Type.Conditional)) {
            const transformed = this.delegateTo(ConditionalNodeTransformer, node);
            if (transformed) this.output = [transformed];
            return;
        }
        if (Pug.isType<Pug.EachNode>(node, Pug.Type.Each)) {
            const transformed = this.delegateTo(EachNodeTransformer, node);
            if (transformed) this.output = [transformed];
            return;
        }
        this.pushError({
            code: ErrorCode.UnsupportedSyntaxError,
            reasons: [`node type ${node.type} is currently not supported`],
            maybeBug: true,
            isFatal: false,
            ...Pug.extractPosInfo(node),
        });
    }

    transformTagNode(node: Pug.TagNode) {
        const codeTransformer = new TagNodeTransformer(node, this.context);
        codeTransformer.transform();
        this.output = codeTransformer.output ? [codeTransformer.output] : undefined;
    }

    transformCodeNode(n: Pug.CodeNode) {
        const codeTransformer = new CodeNodeTransformer(n, this.context);
        codeTransformer.isExpression = n.buffer;
        codeTransformer.transform();
        this.output = codeTransformer.output;
    }
}
