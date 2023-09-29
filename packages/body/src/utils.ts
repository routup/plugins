export function boolToObject<T>(input: T | boolean) : T {
    if (typeof input === 'boolean') {
        return {} as T;
    }

    return input;
}
