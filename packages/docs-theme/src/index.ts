import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme-without-fonts';

import RtButton from './components/RtButton.vue';
import RtCard from './components/RtCard.vue';
import RtCodePanel from './components/RtCodePanel.vue';
import RtHeading from './components/RtHeading.vue';
import RtLogo from './components/RtLogo.vue';
import RtMethodBadge from './components/RtMethodBadge.vue';
import RtSection from './components/RtSection.vue';
import Layout from './Layout.vue';

import './styles/index.css';

export type {
    RoutupThemeConfig,
    RtFooterColumn,
    RtFooterConfig,
    RtFooterLink,
} from './types';

export default {
    extends: DefaultTheme,
    Layout,
    enhanceApp({ app }) {
        app.component('RtButton', RtButton);
        app.component('RtCard', RtCard);
        app.component('RtCodePanel', RtCodePanel);
        app.component('RtHeading', RtHeading);
        app.component('RtLogo', RtLogo);
        app.component('RtMethodBadge', RtMethodBadge);
        app.component('RtSection', RtSection);
    },
} satisfies Theme;
