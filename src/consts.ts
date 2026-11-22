interface Social {
    name: string;
    href: string;
    title: string;
    icon: string;
};

export const SITE_TITLE = "REDasm";
export const BLOG_TITLE = "REDasm Dev Blog"; // <title>, og:site_name
export const SITE_AUTHOR = "Dax";
export const SITE_DESCRIPTION = "The Open Source Disassembler";
export const SITE_TAGLINE = "News, releases and deep dives from REDasm's development.";
export const MAX_RECENTS = 5;

export const SOCIALS: Social[] = [
    {
        name: "GitHub",
        href: "https://github.com/redasm-dev",
        title: `${SITE_TITLE} on GitHub`,
        icon: "github",
    },
    {
        name: "X",
        href: "https://x.com/re_dasm",
        title: `${SITE_TITLE} on X`,
        icon: "twitter",
    },
    {
        name: "Fediverse",
        href: "https://infosec.exchange/@redasm",
        title: `${SITE_TITLE} on Fediverse`,
        icon: "mastodon",
    },
    {
        name: "RSS",
        href: "/rss.xml",
        title: `Subscribe to ${SITE_TITLE}`,
        icon: "rss",
    },
];
