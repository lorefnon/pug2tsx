import { Transformer } from "./Transformer";
import * as Pug from "../pug";
import * as t from "@babel/types";
import { PugNodeTransformer } from "./PugNodeTransformer";
import { compact, flatten, forEach, isEmpty } from "lodash";
import { FunctionBodyTransformer } from "./FunctionBodyTransformer";

export class PugASTTransformer extends Transformer<Pug.BlockNode, t.Statement[]> {
    transform(): void {
        const componentMembers = flatten(
            compact(
                this.input.nodes.map((n: Pug.Node) => {
                    const nodeTransformer = new PugNodeTransformer(n, this.context);
                    nodeTransformer.isTopLevel = true;
                    nodeTransformer.transform();
                    return nodeTransformer.output;
                }),
            ),
        );
        const stmts = this.delegateTo(FunctionBodyTransformer, componentMembers);
        this.output = [...this.context.topLevelStatements];
        if (stmts && !isEmpty(stmts)) {
            this.output.push(this.generateDefaultExport(stmts));
        }
    }
    private get primaryInterfaceName() {
        let interfaceName: string | undefined;
        if (this.context.defaultExportName) {
            forEach(this.context.topLevelStatements, s => {
                if (
                    t.isTSInterfaceDeclaration(s) &&
                    (s.id.name === `${this.context.defaultExportName}Props` ||
                        s.id.name === `I${this.context.defaultExportName}Props`)
                ) {
                    interfaceName = s.id.name;
                }
            });
        }
        return interfaceName;
    }
    private generateDefaultExport(stmts: t.Statement[]) {
        return t.exportDefaultDeclaration(
            t.functionDeclaration(
                this.context.defaultExportName ? t.identifier(this.context.defaultExportName) : null,
                [t.identifier(`props: ${this.primaryInterfaceName || "any"}`)],
                t.blockStatement(stmts || []),
            ),
        );
    }
}
