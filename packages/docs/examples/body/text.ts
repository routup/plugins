import { App, defineCoreHandler } from 'routup';
import { body, readRequestBodyText } from '@routup/body';

export const app = new App();

app.use(body({ text: { limit: '100kb' } }));

// POST a CSV file: one "name,email" line per contact
app.post('/contacts/import', defineCoreHandler(async (event) => {
    const csv = await readRequestBodyText(event);
    const contacts = csv
        .split('\n')
        .filter((line) => line.trim() !== '')
        .map((line) => {
            const [name, email] = line.split(',');

            return { name, email };
        });

    return { imported: contacts.length, contacts };
}));
