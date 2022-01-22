import { transpile } from "../compiler";
import dedent from "dedent";
import { isEmpty } from "lodash";
import { parsePug } from "../transformers/FileTransformer";

test("Pug inside arrow functions", () => {
    const template = dedent`
    const HelloWorld = () =>
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

test("Pug inside old-school functions", () => {
    const template = dedent`
    function HelloWorld(props: SomeProps)
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
    const Hello = () =>
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
    const Hello = () =>
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

test("Unbuffered multiline code", () => {
    const template = dedent`
    -
        const obj = {
            a: 10,
            b: 20
        }

    const Hello = () =>
        #bar.foo = obj.a`;
    expect(parsePug(template)).toMatchSnapshot();
    const transpiledR = transpile(template, {
        defaultExportName: "SampleComponent",
    });
    expect(isEmpty(transpiledR.errors)).toBe(true);
    expect(transpiledR).toMatchSnapshot();
});

test("Sanitization of buffered code", () => {
    const template = dedent`
    const Hello = () =>
        #bar.foo
            = '<div>Hello</div>'`;
    expect(parsePug(template)).toMatchSnapshot();
    const transpiledR = transpile(template, {
        defaultExportName: "SampleComponent",
    });
    expect(isEmpty(transpiledR.errors)).toBe(true);
    expect(transpiledR).toMatchSnapshot();
});

test("Assigning elements", () => {
    const template = dedent`
    const Hello = () =>
        - const foo =
          div.hello
            | World

        div.hello
            SomeTag(name=foo)`;
    expect(parsePug(template)).toMatchSnapshot();
    const transpiledR: any = transpile(template, {
        defaultExportName: "TestComponent",
    });
    expect(isEmpty(transpiledR.errors)).toBe(true);
    expect(transpiledR).toMatchSnapshot();
});


test("Render props", () => {
    const template = dedent`
    const Hello = () =>
        AppContext.Consumer
            = (app) =>
                if app.repositoryRoot
                    #workspace Success
                else
                    #workspace Failure`;
    expect(parsePug(template)).toMatchSnapshot();
    const transpiledR: any = transpile(template);
    expect(isEmpty(transpiledR.errors)).toBe(true);
    expect(transpiledR).toMatchSnapshot();
});

test("Multiple children in nested block", () => {
    const template = dedent`
        - const Foo = () =>
            #foo.bar
                | Foo Bar
            #bar.baz
                | Bar baz
        - const Bar = () =>
            #foo.bar.baz
                | Foo Bar
            #bar.baz
                | Bar baz
        - export default Foo
    `;
    expect(parsePug(template)).toMatchSnapshot();
    const transpiledR: any = transpile(template);
    expect(isEmpty(transpiledR.errors)).toBe(true);
    expect(transpiledR).toMatchSnapshot();
});
