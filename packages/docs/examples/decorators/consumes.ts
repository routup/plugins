import { App } from 'routup';
import { body } from '@routup/body';
import {
    DBody,
    DConsumes,
    DController,
    DGet,
    DPost,
    DPut,
    decorators,
} from '@routup/decorators';

@DController('/notes')
@DConsumes('application/json')
class NoteController {
    // a GET request has no body, so it is not checked
    @DGet('')
    list() {
        return [];
    }

    @DPost('')
    create(@DBody() note: unknown) {
        return note;
    }

    // accepts application/json (class) and any text type (method)
    @DPut('/:id')
    @DConsumes('text/*')
    replace(@DBody() note: unknown) {
        return { note };
    }
}

export const app = new App();

app.use(body());
app.use(decorators({ controllers: [NoteController] }));
