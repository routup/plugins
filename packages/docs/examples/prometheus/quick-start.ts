import { App, defineCoreHandler } from 'routup';
import { prometheus } from '@routup/prometheus';

export const app = new App();

// first, so every route after it is timed; serves /metrics
app.use(prometheus());

app.get('/users/:id', defineCoreHandler((event) => ({ id: event.params.id })));
