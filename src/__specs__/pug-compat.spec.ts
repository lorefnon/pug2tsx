import {transpile} from "../compiler";
import dedent from "dedent";
import {isEmpty} from "lodash";
import {parsePug} from "../transformers/FileTransformer";

describe("Attributes", () => {
    test("Attribute expressions", () => {
        const template = dedent`
        - const Foo = () =>
            a(class='button' href='google.com') Google
            |
            |
            a(class='button', href='google.com') Google
            - var authenticated = true
            div(class=(authenticated ? 'authed' : 'anon'))
        `;
        expect(parsePug(template)).toMatchSnapshot();
        const transpiledR = transpile(template, {});
        expect(transpiledR).toMatchSnapshot();
        expect(isEmpty(transpiledR.errors)).toBe(true);
    });

    test("Multiline attributes", () => {
        const template = dedent`
        - const Foo = () =>
            input(
                type='checkbox'
                name='agreement'
                checked
            )
        `;
        expect(parsePug(template)).toMatchSnapshot();
        const transpiledR = transpile(template, {});
        expect(transpiledR).toMatchSnapshot();
        expect(isEmpty(transpiledR.errors)).toBe(true);
    });

    test("Quoted attributes", () => {
        const template = dedent`
        - const Foo = () =>
            div(class='div-class', (click)='play()')
            div(class='div-class' '(click)'='play()')`;
        expect(parsePug(template)).toMatchSnapshot();
        const transpiledR = transpile(template, {});
        expect(transpiledR).toMatchSnapshot();
        expect(isEmpty(transpiledR.errors)).toBe(true);
    });

    // TODO: Unescaped attributes
    // TODO: Boolean attributes

    test("Style attributes", () => {
        const template = dedent`
        - const Foo = () =>
            a(style={color: 'red', background: 'green'})`;
        expect(parsePug(template)).toMatchSnapshot();
        const transpiledR = transpile(template, {});
        expect(transpiledR).toMatchSnapshot();
        expect(isEmpty(transpiledR.errors)).toBe(true);
    });
    // TODO Autoconvert style string attributes
    // TODO Auto convert from dash to camelcase

    // TODO various cases of merging classes
    // TOOD Attribute blocks
});

describe("Case", () => {
    test("Default usage", () => {
        const template = dedent`
        - const Foo = () => 
            - var friends = 10
            case friends
                when 0
                    p you have no friends
                when 1
                    p you have a friend
                default
                    p you have #{friends} friends`;
        expect(parsePug(template)).toMatchSnapshot();
        const transpiledR = transpile(template, {});
        expect(transpiledR).toMatchSnapshot();
        expect(isEmpty(transpiledR.errors)).toBe(true);
    });
});

describe("Conditional", () => {
    test("Default usage", () => {
        const template = dedent`
        - const Foo = () =>
            - var user = { description: 'foo bar baz' }
            - var authorised = false
            #user
                if user.description
                    h2.green Description
                    p.description= user.description
                else if authorised
                    h2.blue Description
                    p.description.
                        User has no descriptio
                        why not add one...
                else
                    h2.red Description
                    p.description User has no description`;
        expect(parsePug(template)).toMatchSnapshot();
        const transpiledR = transpile(template, {});
        expect(transpiledR).toMatchSnapshot();
        expect(isEmpty(transpiledR.errors)).toBe(true);
    });
});

describe("Each", () => {
    test("Iteration with member", () => {
        const template = dedent`
        - const Foo = () =>
            ul
                each val in [1, 2, 3, 4, 5]
                    li= val`;
        expect(parsePug(template)).toMatchSnapshot();
        const transpiledR = transpile(template, {});
        expect(transpiledR).toMatchSnapshot();
        expect(isEmpty(transpiledR.errors)).toBe(true);
    });
    test("Iteration with member and index", () => {
        const template = dedent`
        - const Foo = () =>
            ul
                each val, index in ['zero', 'one', 'two']
                    li= index + ': ' + val`;
        expect(parsePug(template)).toMatchSnapshot();
        const transpiledR = transpile(template, {});
        expect(transpiledR).toMatchSnapshot();
        expect(isEmpty(transpiledR.errors)).toBe(true);
    });
    test("Iteration over object", () => {
        const template = dedent`
        - const Foo = () =>
            ul
                each val, index in {1:'one',2:'two',3:'three'}
                    li= index + ': ' + val`;
        expect(parsePug(template)).toMatchSnapshot();
        const transpiledR = transpile(template, {});
        expect(transpiledR).toMatchSnapshot();
        expect(isEmpty(transpiledR.errors)).toBe(true);
    });
});
