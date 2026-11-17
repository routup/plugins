import { Counter, Registry } from 'prom-client';
import { App, defineCoreHandler } from 'routup';
import { prometheus } from '@routup/prometheus';

export const registry = new Registry();

const ordersCreated = new Counter({
    name: 'orders_created_total',
    help: 'Total orders created',
    labelNames: ['region'],
    registers: [registry],
});

export const app = new App();

app.use(prometheus({ registry }));

app.post('/orders', defineCoreHandler(() => {
    ordersCreated.inc({ region: 'eu' });

    return { ok: true };
}));
