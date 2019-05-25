import { transpile } from "../compiler";
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

test("Unbuffered multiline code", () => {
    const template = dedent`
    -
        const obj = {
            a: 10,
            b: 20
        }
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
    #bar.foo
        = '<div>Hello</div>'`;
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
    expect(isEmpty(transpiledR.errors)).toBe(true);
    expect(transpiledR).toMatchSnapshot();
});

test("Assigning react elements", () => {
    const template = dedent`
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

test("Internal functions returning JSX", () => {
    const template = dedent`
    - const SomeTag = () =>
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

test("Lifted function components", () => {
    const template = dedent`
    script(type="text/molosser")
        - const SomeTag = () =>
            - const [currentCount, setCount] = useState(0)
            div.hello
                = currentCount

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

test("Without default export", () => {
    const template = dedent`
    script(type="text/molosser")
        - const Foo = () =>
            #foo.bar
                | Foo Bar
        - export default Foo
    `;
    expect(parsePug(template)).toMatchSnapshot();
    const transpiledR: any = transpile(template);
    expect(isEmpty(transpiledR.errors)).toBe(true);
    expect(transpiledR).toMatchSnapshot();
});

test("Multiple children in nested block", () => {
    const template = dedent`
    script(type="text/molosser")
        - const Foo = () =>
            #foo.bar
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
