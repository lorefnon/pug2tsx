import { transpile} from "../compiler";
import dedent from "dedent";
import { isEmpty } from "lodash";
import { parsePug } from "../transformers/FileTransformer";

test("Tag composition", () => {
    const template = dedent`
    #bar.foo
        .foo__node.foo__node--aspect(data-bar="baz")
            | Hello world`;
    expect(parsePug(template)).toMatchSnapshot();
    const transpiledR = transpile(template, {
        defaultExportName: "SampleComponent",
    });
    expect(transpiledR).toMatchSnapshot();
    expect(isEmpty(transpiledR.errors)).toBe(true);
});


test("Interpolated Code", () => {
    const template = dedent`
    - const foo = "bar";
    #bar.foo
        .foo__node.foo__node--aspect(data-bar="baz")= foo
    div.hello
        = \`Hello \${foo}\``;
    expect(parsePug(template)).toMatchSnapshot();
    const transpiledR = transpile(template, {
        defaultExportName: "SampleComponent",
    });
    expect(isEmpty(transpiledR.errors)).toBe(true);
    expect(transpiledR).toMatchSnapshot();
});

test("Interleaved unbuffered code", () => {
    const template = dedent`
    - const foo = "bar";
    #bar.foo
        .foo__node.foo__node--aspect Test
    - const bar = "baz";
    div.hello
        = \`Hello \${foo} \${bar}\``;
    expect(parsePug(template)).toMatchSnapshot();
    const transpiledR = transpile(template, {
        defaultExportName: "SampleComponent",
    });
    expect(isEmpty(transpiledR.errors)).toBe(true);
    expect(transpiledR).toMatchSnapshot();
});

test("Top level scripts", () => {
    const template = dedent`
    script.
        import SomeTag from "./SomeTag";
        
    div.hello
        SomeTag(name=props.foo)`;
    expect(parsePug(template)).toMatchSnapshot();
    const transpiledR = transpile(template);
    console.log(transpiledR.errors);
    expect(isEmpty(transpiledR.errors)).toBe(true);
    expect(transpiledR).toMatchSnapshot();
});

test("Props interface detection", () => {
    const template = dedent`
    script.
        interface ITestComponentProps {
            foo: string;
        }
        
    div.hello
        SomeTag(name=props.foo)`;
    expect(parsePug(template)).toMatchSnapshot();
    const transpiledR: any = transpile(template, {
        defaultExportName: "TestComponent",
    });
    console.log(transpiledR.errors);
    expect(isEmpty(transpiledR.errors)).toBe(true);
    expect(transpiledR).toMatchSnapshot();
});

