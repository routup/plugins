import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';

import './styles/index.css';

export type {
    RoutupThemeConfig,
    RtFooterColumn,
    RtFooterConfig,
    RtFooterLink,
} from './types';

export default { extends: DefaultTheme } satisfies Theme;
