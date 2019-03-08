export enum Type {
    Tag = "Tag",
    Block = "Block",
    Code = "Code",
    Each = "Each",
    Text = "Text",
    Conditional = "Conditional",
}
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
    val: string;
    line: number;
    column: number;
    mustEscape: boolean;
}
export interface BlockNode extends BaseNode<Type.Block>, LineInfo {
    nodes: BaseNode<Type>[];
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
}
export interface EachNode extends BaseNode<Type.Each>, LineInfo, ColInfo {
    obj: string;
    val: string;
    key: string | null;
    block: BlockNode;
}
export interface ConditionalNode extends BaseNode<Type.Conditional>, LineInfo, ColInfo {
    test: string;
    consequent: BlockNode;
    alternate: BlockNode | null;
}
export interface TextNode extends BaseNode<Type.Text>, LineInfo, ColInfo {
    val: string;
}
export type Node = BlockNode | TopLevelNode;
export type TopLevelNode = TagNode | CodeNode | EachNode | ConditionalNode;
