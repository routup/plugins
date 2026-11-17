import { App } from 'routup';
import {
    DController,
    DDelete,
    DGet,
    DPost,
    DProduces,
    DStatus,
    decorators,
} from '@routup/decorators';

@DController('/jobs')
class JobController {
    @DStatus(202)
    @DPost('')
    enqueue() {
        return { id: 'job-1', state: 'queued' };
    }

    // 204 needs a returned null: undefined does not answer the request
    @DStatus(204)
    @DDelete('/:id')
    cancel() {
        return null;
    }

    @DProduces('text/csv')
    @DGet('/export')
    export() {
        return 'id,state\njob-1,queued\n';
    }
}

export const app = new App();

app.use(decorators({ controllers: [JobController] }));
