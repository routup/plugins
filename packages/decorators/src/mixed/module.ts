export function DDeprecated() : any {
    return () => {};
}
export function DDescription<T>(name: string | number, description?: string, example?: T): any {
    return () => { };
}

export function DHidden() {
    return () => {};
}

export function DExample<T>(example: any) {
    return (...args: any) => {};
}

export function DSecurity(roles?: string | string[], name?: string) {
    return (...args: any) => { };
}

export function DTags(...names: string[]) {
    return (...args: any) => { };
}
