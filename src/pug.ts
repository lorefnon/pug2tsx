import { pick } from "lodash";

export enum Type {
    Tag = "Tag",
    Block = "Block",
    Code = "Code",
    Each = "Each",
    Text = "Text",
    Conditional = "Conditional",
    Case = "Case",
    When = "When",
}
export const isType = <NodeT extends BaseNode<any>>(t: BaseNode<any>, type: NodeT["type"]): t is NodeT =>
    t.type === type;

export interface BaseNode<T extends Type> {
    type: T;
}
export interface LineInfo {
    line: number;
}
export interface ColInfo {
    column: number;
}
export interface Attr {
    name: string;
    val: string | boolean;
    line: number;
    column: number;
    mustEscape: boolean;
}
export interface BlockNode extends BaseNode<Type.Block>, LineInfo {
    nodes: Node[];
}
export interface TagNode extends BaseNode<Type.Tag>, LineInfo, ColInfo {
    name: string;
    selfClosing: false;
    block: BlockNode;
    attrs: Attr[];
    isInline: false;
}
export interface CodeNode extends BaseNode<Type.Code>, LineInfo, ColInfo {
    val: string;
    isInline: boolean;
    mustEscape: boolean;
    buffer: false;
    block: BlockNode;
}
export interface EachNode extends BaseNode<Type.Each>, LineInfo, ColInfo {
    obj: string;
    val: string;
    key: string | null;
    block: BlockNode;
}
export interface ConditionalNode extends BaseNode<Type.Conditional>, LineInfo, ColInfo {
    test: string;
    consequent: Node;
    alternate: Node | null;
}
export interface TextNode extends BaseNode<Type.Text>, LineInfo, ColInfo {
    val: string;
}
export interface CaseNode extends BaseNode<Type.Case>, LineInfo, ColInfo {
    expr: string;
    block: BlockNode;
}
export interface WhenNode extends BaseNode<Type.When>, LineInfo, ColInfo {
    expr: string;
    block: BlockNode;
}
export type Node = BlockNode | TopLevelNode | CaseNode | TextNode | WhenNode;
export type TopLevelNode = TagNode | CodeNode | EachNode | ConditionalNode | WhenNode;

export const extractPosInfo = (node: any): { line: number; column: number } => pick(node, ["line", "column"]);
