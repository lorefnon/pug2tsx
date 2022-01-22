import {Transformer} from "./Transformer";
import * as Pug from "../pug";
import * as t from "@babel/types";
import {PugNodeTransformer} from "./PugNodeTransformer";
import {compact, flatten} from "lodash";

export class PugASTTransformer extends Transformer<Pug.BlockNode, t.Node[]> {
    transform(): void {
        this.output = flatten(compact(
            this.input.nodes.map((n: Pug.Node) => {
                const nodeTransformer = new PugNodeTransformer(n, this.context);
                nodeTransformer.isTopLevel = true;
                nodeTransformer.transform();
                return nodeTransformer.output;
            }),
        ));
    }
}
