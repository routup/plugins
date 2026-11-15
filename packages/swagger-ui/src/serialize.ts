import { randomUUID } from 'node:crypto';
import { Script } from 'node:vm';

const UNSAFE_JSON_CHARS = /[<>&\u2028\u2029]/g;

function isExpression(source: string) : boolean {
    try {
        // compiled only, never run
        return !!new Script(`(${source}\n)`);
    } catch {
        return false;
    }
}

const toObjectValue = (source: string) => `Object.values({ ${source}\n })[0]`;

// `async` and/or `*` before a computed method name.
const COMPUTED_METHOD_RE = /^((?:async\s*)?(?:\*\s*)?)\[/;

/**
 * Read a method shorthand back from an object literal. A computed name
 * (`[key]() {}`) is replaced by `_`, since its expression refers to
 * server-side scope; the end of the name is the first `]` that leaves
 * a source which compiles.
 */
function toMethodExpression(source: string) : string | undefined {
    const match = COMPUTED_METHOD_RE.exec(source);

    if (!match) {
        const output = toObjectValue(source);

        return isExpression(output) ? output : undefined;
    }

    const prefix = match[1]!;

    for (let end = source.indexOf(']', prefix.length); end !== -1; end = source.indexOf(']', end + 1)) {
        const output = toObjectValue(`${prefix}_${source.substring(end + 1)}`);

        if (isExpression(output)) {
            return output;
        }
    }

    return undefined;
}

/**
 * Turn a function into source that is valid as an expression.
 * Function expressions, arrows and classes are kept; method shorthand
 * of any form (`foo() {}`, `async *foo() {}`, `[key]() {}`,
 * `'foo'() {}`) is wrapped in an object literal and read back.
 */
function toFunctionSource(key: string, fn: CallableFunction) : string {
    const source = fn.toString();

    if (source.includes('[native code]')) {
        throw new Error(
            `The swagger-ui option ${JSON.stringify(key)} is a bound or native function, ` +
            'which cannot be serialized. Pass a plain function instead.',
        );
    }

    if (isExpression(source)) {
        return source;
    }

    const method = toMethodExpression(source);

    if (method) {
        return method;
    }

    throw new Error(`The swagger-ui option ${JSON.stringify(key)} cannot be serialized as a function expression.`);
}

// JSON.stringify (indented) starts every key on its own line;
// a literal `"__proto__":` key would set the prototype instead.
const PROTO_KEY_RE = /^(\s*)"__proto__":/gm;

/**
 * Serialize options to a JavaScript expression.
 *
 * JSON values have `<`, `>`, `&`, U+2028 and U+2029 escaped, so the
 * output cannot close a surrounding element or comment, wherever it is
 * inlined. `__proto__` keys are emitted as computed keys, so they stay
 * own properties. Function values are emitted as their source.
 */
export function serializeOptions(input: Record<string, any>) : string {
    const token = `__routup_fn_${randomUUID().replace(/-/g, '')}_`;
    const fns : string[] = [];

    const json = JSON.stringify(input, (key, value) => {
        if (typeof value === 'function') {
            fns.push(toFunctionSource(key, value));

            return `${token}${fns.length - 1}`;
        }

        return value;
    }, 2) ?? '{}';

    return json
        .replace(PROTO_KEY_RE, '$1["__proto__"]:')
        .replace(UNSAFE_JSON_CHARS, (char) => `\\u${char.charCodeAt(0).toString(16).padStart(4, '0')}`)
        .replace(new RegExp(`"${token}(\\d+)"`, 'g'), (_match, index) => `(${fns[Number(index)]})`);
}

export function escapeHTML(input: string) : string {
    return input
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;')
        .replace(/'/g, '&#39;');
}
