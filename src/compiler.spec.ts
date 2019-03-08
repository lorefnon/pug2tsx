import { transpile } from "./compiler";
import dedent from "dedent";
import { isEmpty } from "lodash";

test("Simple tag composition", () => {
    const transpiledR = transpile(
        dedent`
            #bar.foo
                .foo__node.foo__node--aspect(data-bar="baz")
                    | Hello world`,
        {
            defaultExportName: "SampleComponent",
        },
    );
    expect(isEmpty(transpiledR.errors)).toBe(true);
    expect(transpiledR.result).toMatchSnapshot();
});

test("Interpolated Code", () => {
    const transpiledR = transpile(
        dedent`
            - const foo = "bar";
            #bar.foo
                .foo__node.foo__node--aspect(data-bar="baz")= foo
            div.hello
                = \`Hello \${foo}\``,
        {
            defaultExportName: "SampleComponent",
        },
    );
    expect(isEmpty(transpiledR.errors)).toBe(true);
    expect(transpiledR.result).toMatchSnapshot();
});

test("Interleaved unbuffered code", () => {
    const transpiledR = transpile(
        dedent`
            - const foo = "bar";
            #bar.foo
                .foo__node.foo__node--aspect Test
            - const bar = "baz";
            div.hello
                = \`Hello \${foo} \${bar}\``,
        {
            defaultExportName: "SampleComponent",
        },
    );
    expect(isEmpty(transpiledR.errors)).toBe(true);
    expect(transpiledR.result).toMatchSnapshot();
});

test("Top level scripts", () => {
    const transpiledR = transpile(
        dedent`
            script.
                import SomeTag from "./SomeTag";
                
            div.hello
                SomeTag(name=props.foo)`
    );
    console.log(transpiledR.errors);
    expect(isEmpty(transpiledR.errors)).toBe(true);
    expect(transpiledR.result).toMatchSnapshot();
});

test("Props interface detection", () => {
    const transpiledR = transpile(
        dedent`
            script.
                interface ITestComponentProps {
                    foo: string;
                }
                
            div.hello
                SomeTag(name=props.foo)`
    , {defaultExportName: "TestComponent"});
    console.log(transpiledR.errors);
    expect(isEmpty(transpiledR.errors)).toBe(true);
    expect(transpiledR.result).toMatchSnapshot();
});
