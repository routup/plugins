import {
    DController,
    DCookie,
    DCookies,
    DGet,
} from '../../src';

@DController('/cookie')
export class CookieController {
    @DGet('many')
    getMany(
        @DCookies() cookies: Record<string, any>,
    ) {
        return cookies;
    }

    @DGet('single')
    get(
        @DCookie('foo') foo: string,
    ) {
        return foo;
    }
}
