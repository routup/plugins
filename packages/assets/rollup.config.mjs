import { readFileSync } from 'node:fs';

import { createConfig } from '../../rollup.config.mjs';

export default {
    ...createConfig({
        pkg: JSON.parse(readFileSync(new URL('./package.json', import.meta.url), 'utf8')),
        defaultExport: true
    }),
    input: 'src/index.ts'
};
