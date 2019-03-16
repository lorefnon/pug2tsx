import * as Pug from "../pug";
import * as t from "@babel/types";
import { Transformer } from "./Transformer";
import { compact, find } from "lodash";
import { parseExpression } from "@babel/parser";
import { ErrorCode } from "../CompilationError";
import { NodeChildTransformer } from "./NodeChildTransformer";

export class EachNodeTransformer extends Transformer<Pug.EachNode, t.Node> {
    transform(): void {
        if (
            !find(
                this.context.topLevelStatements,
                stmt => t.isImportDeclaration(stmt) && stmt.source.value === "lodash/map",
            )
        )
            this.context.topLevelStatements.push(
                t.importDeclaration(
                    [t.importSpecifier( t.identifier("map"), t.identifier("default"))],
                    t.stringLiteral("lodash/map"),
                ),
            );
        try {
            const body = this.delegateTo(NodeChildTransformer, this.input.block);
            if (!body) return;
            this.output = t.callExpression(
                t.identifier("map"),
                [
                    parseExpression(this.input.obj),
                    t.arrowFunctionExpression(
                        compact([t.identifier(this.input.val), this.input.key && t.identifier(this.input.key)]),
                        body
                    ),
                ]
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
