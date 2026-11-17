import { App } from 'routup';
import { basic } from '@routup/basic';
import {
    DBody,
    DController,
    DCookie,
    DCookies,
    DGet,
    DPost,
    DQuery,
    decorators,
} from '@routup/decorators';

type Item = { sku: string, quantity: number };

@DController('/cart')
class CartController {
    @DGet('')
    show(
        @DCookies() cookies: Record<string, string>,
        @DQuery() query: Record<string, unknown>,
    ) {
        return { cart: cookies.cart ?? null, query };
    }

    @DPost('/items')
    add(
        @DBody() item: Item,
        @DQuery('currency') currency: string | undefined,
        @DCookie('cart') cart: string | undefined,
    ) {
        return {
            cart: cart ?? null,
            item,
            currency: currency ?? 'EUR',
        };
    }
}

export const app = new App();

// basic() registers body(), cookie() and query(): before the controllers
app.use(basic());
app.use(decorators({ controllers: [CartController] }));
