import generateJS from '@babel/generator';
import { parse, parseExpression } from '@babel/parser';
import * as t from '@babel/types';
import _debug from 'debug';
import { capitalize, castArray, first, forEach, includes, partition, some, upperFirst } from 'lodash';
import * as path from 'path';
import prettier from 'prettier';
// @ts-ignore
import pugLexer from 'pug-lexer';
// @ts-ignore
import pugParser from 'pug-parser';

import * as Pug from './pug';

const debug = _debug("tspugr:compiler");

const isType = <NodeT extends Pug.BaseNode<any>>(node: any, type: NodeT["type"]): node is NodeT => node.type === type;

enum ErrorCode {
    FileTypeError = "FileTypeError",
    PugParseError = "PugParseError",
    IncorrectSyntaxError = "IncorrectSyntaxError",
    UnsupportedSyntaxError = "UnsupportedSyntaxError",
    GenerationError = "GenerationError",
    UnknownProcessingError = "UnknownProcessingError",
}

interface CompileError<CodeT extends ErrorCode = ErrorCode> {
    code: CodeT;
    message?: string;
    filePath?: string;
    line?: number;
    column?: number;
    maybeBug?: boolean;
    isFatal: boolean;
    originalError?: Error;
}

export interface Result<T = any, E = CompileError> {
    result?: T;
    errors?: E[];
}

export const someFatal = (errors: undefined | CompileError[]) => some(errors, { isFatal: true });
const wrapErrToResult = (error: CompileError): Result => ({ errors: [error] });
const wrapResult = <T>(result: T): Result<T> => ({ result });

export interface CompilationOptions {
    filePath?: string;
    defaultExportName?: string;
}

export const transpile = (
    inputContent: string,
    options: CompilationOptions = {},
    errors: CompileError<ErrorCode>[] = [],
) => {
    normalizeOptions(options);
    return accumulateErrors(
        errors,
        (): Result<string> => {
            let tokens, ast;
            try {
                tokens = pugLexer(inputContent, { filename: options.filePath });
                ast = pugParser(tokens, { filename: options.filePath, src: inputContent });
            } catch (e) {
                return wrapErrToResult({
                    code: ErrorCode.PugParseError,
                    originalError: e,
                    message: "Failed to parse Pug Template",
                    filePath: options.filePath,
                    isFatal: true,
                });
            }
            if (ast.type !== "Block")
                return wrapErrToResult({
                    code: ErrorCode.UnsupportedSyntaxError,
                    message: "Expected top level to be a block",
                    column: 1,
                    line: 1,
                    filePath: options.filePath,
                    isFatal: true,
                });
            const { result: nodes, errors = [] } = transpilePugASTToBabelAST(ast, options);
            if (!nodes) return { errors };
            return serializeBabelAST(nodes, errors);
        },
    );
};

export const serializeBabelAST = (nodes: t.Node[], errors: CompileError[]) => {
    let result: string;
    try {
        result = nodes.map(n => generateJS(n).code).join("\n\n");
    } catch (e) {
        errors.push({
            code: ErrorCode.GenerationError,
            message: "Failed to generate javascript from transformed AST",
            maybeBug: true,
            originalError: e,
            isFatal: true,
        });
        return { errors };
    }
    debug("result:", result);
    try {
        result = prettier.format(result);
        debug("Prettified result:", result);
    } catch (e) {
        errors.push({
            code: ErrorCode.GenerationError,
            message: "Failed to prettify generated javascript",
            isFatal: false,
        });
    }
    return { result, errors };
};

export const transpilePugASTToBabelAST = (pugAst: Pug.BlockNode, options: CompilationOptions = {}) =>
    transpileTopLevelNodes(pugAst.nodes as any, options);

export const normalizeOptions = (options: CompilationOptions) => {
    if (!options.defaultExportName && options.filePath) {
        const fileName = path.basename(options.filePath);
        options.defaultExportName = upperFirst(capitalize(fileName.split(".")[0]!));
    }
};

const accumulateErrors = <T extends Result>(errors: CompileError<ErrorCode>[], run: () => T) => {
    const result = run();
    if (result.errors) errors.push(...result.errors);
    return result;
};

const transpileTopLevelNodes = (
    topLevelNodes: Pug.TopLevelNode[],
    options: CompilationOptions,
): Result<t.Statement[]> => {
    const nodesRArr = topLevelNodes.map(n => transpilePugNode(n, { isTopLevel: true }));
    const errors: CompileError[] = [];
    if (someFatal(errors)) return { errors };
    const topLevelStmts: t.Statement[] = [];
    const componentMembers: t.Node[] = [];
    for (const nodeR of nodesRArr) {
        if (nodeR.errors) {
            errors.push(...nodeR.errors);
        }
        if (nodeR.result) {
            if (nodeR.result.isTopLevel) {
                topLevelStmts.push(...(nodeR.result.nodes as any));
            } else {
                componentMembers.push(...nodeR.result.nodes);
            }
        }
    }
    let precedingStatements: t.Statement[] = [];
    let jsxElements: (t.JSXElement | t.JSXExpressionContainer)[] = [];
    for (let i = 0; i < componentMembers.length; i++) {
        const node = componentMembers[i];
        if (t.isStatement(node)) {
            if (jsxElements.length === 0) {
                precedingStatements.push(node);
            } else {
                jsxElements.push(
                    t.jsxExpressionContainer(
                        t.callExpression(
                            t.arrowFunctionExpression(
                                [],
                                t.blockStatement(transformNodesToFnBodyStatements(componentMembers.slice(i))),
                            ),
                            [],
                        ),
                    ),
                );
                break;
            }
        } else if (t.isJSXElement(node)) {
            jsxElements.push(node);
        }
    }
    let interfaceName: string | undefined;
    if (options.defaultExportName) {
        forEach(topLevelStmts, (s) => {
            if (t.isTSInterfaceDeclaration(s) && (s.id.name === `${options.defaultExportName}Props` || s.id.name === `I${options.defaultExportName}Props`)) {
                interfaceName = s.id.name;
            }
        })
    }
    return wrapResult([
        t.importDeclaration([t.importNamespaceSpecifier(t.identifier("React"))], t.stringLiteral("react")),
        ...topLevelStmts,
        t.exportDefaultDeclaration(
            t.functionDeclaration(
                options.defaultExportName ? t.identifier(options.defaultExportName) : null,
                [ /* t.identifier("props", null, false, interfaceName ? t.tsTypeAnnotation(t.tsTypeReference(t.identifier(interfaceName))) : undefined) */
                    t.identifier(interfaceName ? `props: ${interfaceName}` : 'props')
                ],
                t.blockStatement([
                    ...precedingStatements,
                    jsxElements.length === 1 && t.isJSXElement(jsxElements[0])
                        ? t.returnStatement(jsxElements[0] as any)
                        : t.returnStatement(t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), jsxElements)),
                ]),
            ),
        ),
    ]);
};

const transpilePugNode = (
    node: Pug.BaseNode<any>,
    context: { isTopLevel: boolean },
): Result<{ nodes: t.Node[]; isTopLevel?: boolean }> => {
    if (isType<Pug.TagNode>(node, Pug.Type.Tag)) {
        if (
            includes(
                [
                    "html",
                    "body",
                    "link",
                    "meta",
                    "Doctype",
                    "style", // TODO Fixme
                ],
                node.name,
            )
        ) {
            return wrapErrToResult({
                code: ErrorCode.UnsupportedSyntaxError,
                message: `${node.name} is not supported`,
                maybeBug: false,
                isFatal: true,
                column: (node as any).column,
                line: (node as any).line,
            });
        }
        if (node.name === "script") {
            if (some(node.attrs, a => a.name === "src")) {
                return wrapErrToResult({
                    code: ErrorCode.UnsupportedSyntaxError,
                    message: `External script tags are currently not supported`,
                    maybeBug: false,
                    isFatal: true,
                    column: (node as any).column,
                    line: (node as any).line,
                });
            }
            if (some(node.attrs, a => a.name === "type" && a.val !== "text/typescript")) {
                return wrapErrToResult({
                    code: ErrorCode.UnsupportedSyntaxError,
                    message: `Script tags can only contain typescript`,
                    maybeBug: false,
                    isFatal: true,
                    column: (node as any).column,
                    line: (node as any).line,
                });
            }
            if (!context.isTopLevel) {
                return wrapErrToResult({
                    code: ErrorCode.UnsupportedSyntaxError,
                    message: `node of type ${node.type} is currently only supported at top level`,
                    maybeBug: false,
                    isFatal: true,
                    column: (node as any).column,
                    line: (node as any).line,
                });
            }
            if (node.block && some(node.block.nodes, n => n.type !== "Text")) {
                return wrapErrToResult({
                    code: ErrorCode.UnsupportedSyntaxError,
                    message: `script or style tags can have only text nodes`,
                    maybeBug: false,
                    isFatal: true,
                    column: (node as any).column,
                    line: (node as any).line,
                });
            }
            const inner = node.block.nodes.map((n: any) => n.val).join("\n");
            const transpiledR = transpileEmbeddedCode(inner, false, node);
            return {
                errors: transpiledR.errors,
                result: transpiledR.result
                    ? {
                          nodes: castArray(transpiledR.result),
                          isTopLevel: true,
                      }
                    : undefined,
            };
        }
        const transpiledR = transpileTagNode(node);
        return {
            errors: transpiledR.errors,
            result: transpiledR.result
                ? {
                      nodes: castArray(transpiledR.result),
                      isTopLevel: false,
                  }
                : undefined,
        };
    }
    if (isType<Pug.CodeNode>(node, Pug.Type.Code)) {
        const transpiledR = transpileCodeNode(node);
        return {
            errors: transpiledR.errors,
            result: transpiledR.result
                ? {
                      nodes: castArray(transpiledR.result),
                      isTopLevel: false,
                  }
                : undefined,
        };
    }
    return wrapErrToResult({
        code: ErrorCode.UnsupportedSyntaxError,
        message: `node type ${node.type} is currently not supported`,
        maybeBug: true,
        isFatal: false,
        column: (node as any).column,
        line: (node as any).line,
    });
};

const transformNodesToFnBodyStatements = (nodes: t.Node[]): t.Statement[] => {
    let precedingStatements: t.Statement[] = [];
    let jsxElements: (t.JSXElement | t.JSXExpressionContainer)[] = [];
    for (let i = 0; i < nodes.length; i++) {
        const node = nodes[i];
        if (t.isStatement(node)) {
            if (jsxElements.length === 0) {
                precedingStatements.push(node);
            } else {
                jsxElements.push(
                    t.jsxExpressionContainer(
                        t.callExpression(
                            t.arrowFunctionExpression(
                                [],
                                t.blockStatement(transformNodesToFnBodyStatements(nodes.slice(i + 1))),
                            ),
                            [],
                        ),
                    ),
                );
                break;
            }
        } else if (t.isJSXElement(node)) {
            jsxElements.push(node);
        }
    }
    if (jsxElements.length === 0) return precedingStatements;
    if (jsxElements.length === 1) {
        const soloEl = first(jsxElements)!;
        if (t.isJSXElement(soloEl)) return [...precedingStatements, t.returnStatement(soloEl)];
    }
    return [
        ...precedingStatements,
        t.returnStatement(t.jsxFragment(t.jsxOpeningFragment(), t.jsxClosingFragment(), jsxElements)),
    ];
};

const transpileTagNode = (node: Pug.TagNode): Result<t.Node> => {
    try {
        const [classNameAttrs, otherAttrs] = partition(
            node.attrs || [],
            a => a.name === "class" || a.name === "className",
        );
        const attrs = otherAttrs.map((a: any) =>
            t.jsxAttribute(
                t.jsxIdentifier(a.name === "class" ? "className" : a.name),
                t.jsxExpressionContainer(parseExpression(a.val)),
            ),
        );
        if (classNameAttrs.length === 1) {
            attrs.push(
                t.jsxAttribute(
                    t.jsxIdentifier("className"),
                    t.jsxExpressionContainer(parseExpression(classNameAttrs[0].val)),
                ),
            );
        } else if (classNameAttrs.length > 1) {
            attrs.push(
                t.jsxAttribute(
                    t.jsxIdentifier("className"),
                    t.jsxExpressionContainer(
                        t.callExpression(
                            t.memberExpression(
                                t.arrayExpression(classNameAttrs.map(a => parseExpression(a.val))),
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
            let { result, errors } = transpileTagBlockNode(node.block);
            if (someFatal(errors)) return { errors };
            if (result) children = result;
        }
        return {
            result: t.jsxElement(
                t.jsxOpeningElement(t.jsxIdentifier(node.name), attrs, false),
                t.jsxClosingElement(t.jsxIdentifier(node.name)),
                children,
                false,
            ),
        };
    } catch (e) {
        // TODO Improve this
        return wrapErrToResult({
            code: ErrorCode.IncorrectSyntaxError,
            maybeBug: false,
            isFatal: false,
            column: node.column,
            line: node.line,
        });
    }
};

const transpileTagBlockNode = (node: Pug.BlockNode): Result<(t.JSXElement | t.JSXExpressionContainer)[]> => {
    const result: Result<(t.JSXElement | t.JSXExpressionContainer)[]> = { result: [], errors: [] };
    for (const child of node.nodes) {
        const nodeTrResult = transpilePugNode(child, { isTopLevel: false });
        if (someFatal(nodeTrResult.errors)) return { errors: [...result.errors!, ...nodeTrResult.errors!] };
        if (nodeTrResult.errors) result.errors!.push(...nodeTrResult.errors);
        for (const {nodes: childNodes, isTopLevel} of castArray(nodeTrResult.result)) {
            if (isTopLevel) {
                result.errors!.push({
                    code: ErrorCode.UnsupportedSyntaxError,
                    maybeBug: true,
                    isFatal: false,
                    column: (child as any).column,
                    line: (child as any).line || node.line
                });
            } else {
                for (const childNode of childNodes) {
                    if (t.isJSXElement(childNode)) result.result!.push(childNode);
                    else if (t.isExpression(childNode) || t.isIdentifier(childNode))
                        result.result!.push(t.jsxExpressionContainer(childNode));
                    else
                        result.errors!.push({
                            code: ErrorCode.UnsupportedSyntaxError,
                            maybeBug: true,
                            isFatal: false,
                            column: (child as any).column,
                            line: (child as any).line || node.line
                        });
                }    
            }
        }
    }
    return result;
};

const transpileCodeNode = (node: Pug.CodeNode): Result<t.Node[]> => transpileEmbeddedCode(node.val, node.buffer, node);

const transpileEmbeddedCode = (code: string, isExpression = false, parentNode: Pug.CodeNode | Pug.TagNode) => {
    let parsed: t.Node[];
    const parseOpts = {
        sourceType: "module" as "module",
        plugins: ["typescript" as "typescript"],
    };
    try {
        if (isExpression) {
            parsed = [parseExpression(code, parseOpts)];
        } else {
            parsed = parse(code, parseOpts).program.body;
        }
        return wrapResult(parsed);
    } catch (e) {
        return wrapErrToResult({
            code: ErrorCode.IncorrectSyntaxError,
            isFatal: true,
            maybeBug: false,
            originalError: e,
            line: parentNode.line,
            column: parentNode.column,
        });
    }
};
