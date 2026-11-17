import { App, createError } from 'routup';
import { body } from '@routup/body';
import {
    DBody,
    DController,
    DDelete,
    DGet,
    DPatch,
    DPath,
    DPost,
    DStatus,
    decorators,
} from '@routup/decorators';

type Todo = {
    id: string,
    title: string,
    done: boolean
};

@DController('/todos')
class TodoController {
    constructor(private readonly todos: Map<string, Todo>) {}

    @DGet('')
    list() {
        return this.todos.values().toArray();
    }

    @DGet('/:id')
    show(@DPath('id') id: string) {
        return this.find(id);
    }

    @DStatus(201)
    @DPost('')
    create(@DBody('title') title: unknown) {
        if (typeof title !== 'string' || title.length === 0) {
            throw createError({ status: 400, message: 'title must be a non-empty string' });
        }

        const todo = {
            id: String(this.todos.size + 1),
            title,
            done: false,
        };

        this.todos.set(todo.id, todo);

        return todo;
    }

    @DPatch('/:id')
    update(@DPath('id') id: string, @DBody('done') done: unknown) {
        const todo = this.find(id);

        todo.done = done === true;

        return todo;
    }

    @DStatus(204)
    @DDelete('/:id')
    remove(@DPath('id') id: string) {
        const todo = this.find(id);

        this.todos.delete(todo.id);

        return null;
    }

    private find(id: string): Todo {
        const todo = this.todos.get(id);

        if (!todo) {
            throw createError({ status: 404, message: `todo ${id} not found` });
        }

        return todo;
    }
}

export const app = new App();

app.use(body());
// an instance, so the controller gets its store
app.use(decorators({ controllers: [new TodoController(new Map())] }));
