export type RtFooterLink = {
    text: string;
    link: string;
};

export type RtFooterColumn = {
    title: string;
    links: RtFooterLink[];
};

export type RtFooterConfig = {
    tagline: string;
    columns: RtFooterColumn[];
    note?: string;
};

export type RoutupThemeConfig = {
    rtFooter?: RtFooterConfig;
};
