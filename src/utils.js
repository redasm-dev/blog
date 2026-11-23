import { readFileSync } from "fs";
import { createMarkdownProcessor } from "@astrojs/markdown-remark";
import redasmTheme from "./redasm-theme.js";
import { getCollection } from "astro:content";
import { html } from "satori-html";
import satori from "satori";
import sharp from "sharp";

// Excerpt: the start of a post, up to a "more" marker on its own line:
//   <!-- more -->      in .md
//   {/* more */}       in .mdx (MDX has no HTML comments)
// Rendered with Astro's own Markdown processor (same smart quotes, GFM, highlighting as
// the post), so it must be plain Markdown: MDX components before the marker won't render.
// Returns HTML, or null for posts without a marker.
const MORE_MARKER = /^[ \t]*(?:<!--\s*more\s*-->|\{\/\*\s*more\s*\*\/\})[ \t]*$/m;
let markdownProcessor;

export async function getExcerpt(post) {
    const marker = post.body?.match(MORE_MARKER);
    if (!marker) return null;

    const source = post.body.slice(0, marker.index)
        .replace(/^(?:import|export)\s.*$/gm, ""); // MDX module lines (imports of components)

    markdownProcessor ??= createMarkdownProcessor({ shikiConfig: { theme: redasmTheme } });
    const { code } = await (await markdownProcessor).render(source);
    return code;
}

export async function getPosts() {
    return (await getCollection("blog", ({ data }) => import.meta.env.PROD ? !data.draft : true));
}

export async function getSortedPosts() {
    return (await getPosts()).sort((p1, p2) => {
        const d1 = p1.data.published || p1.data.modified;
        const d2 = p2.data.published || p2.data.modified;
        return d2.valueOf() - d1.valueOf();
    });
}

export async function getGroupedPosts() {
    const posts = await getSortedPosts();
    let res = {};

    for (const p of posts) {
        const year = p.data.published.getFullYear();

        if (Array.isArray(res[year]))
            res[year].push(p);
        else
            res[year] = [p];
    }

    return res;
}

export async function getTags(posts) {
    if (!Array.isArray(posts))
        posts = await getSortedPosts();

    let res = {}

    for (const p of posts) {
        // Make post's tags unique
        const s = new Set(p.data.tags);

        for (const tag of s) {
            if (tag in res)
                res[tag]++;
            else
                res[tag] = 1;
        }
    }

    return res;
}

export function getPostsByTag(posts, tag) {
    let res = [];

    for (const p of posts) {
        if (p.data.tags.includes(tag))
            res.push(p)
    }

    return res;
}

// Open Graph image (1200x630) for link previews: logo + "Dev Blog", the title, an optional
// footer line, blog.redasm.dev, and on the right a piece of disassembly in REDasm's colors
// (as in redasm-theme.js) on a panel that blends into the page and runs off the bottom.
// Rendered with satori, so markup is limited: every element with children needs display: flex.
const OG = {
    page: "#2f2f2f", panel: "#202020", fg: "#f4f1d6", mutedText: "#9a9a9a", primary: "#c03131",
    stop: "#ff7575", call: "#96d952", reg: "#f8c7ff", number: "#ffb22e",
    function: "#96d952", location: "#90caf9",
};

// mnemonic, then operands as [text, color] parts; mnemonic color defaults to foreground.
// Windows API calls by name, jumps to loc_ labels: how REDasm shows them.
// satori trims spaces at the edges of spans: a trailing space becomes a margin.
const R = text => [text, OG.reg], N = text => [text, OG.number], F = text => [text, OG.function],
    L = text => [text, OG.location], P = text => [text, OG.fg];

const OG_DISASM = [
    ["push", [R("ebp")]],
    ["mov", [R("ebp"), P(", "), R("esp")]],
    ["push", [N("0")]],
    ["call", [F("GetModuleHandleA")], OG.call],
    ["mov", [P("["), R("ebp"), P("-"), N("4"), P("], "), R("eax")]],
    ["call", [F("IsDebuggerPresent")], OG.call],
    ["test", [R("eax"), P(", "), R("eax")]],
    ["jne", [L("loc_401040")], OG.stop],
    ["xor", [R("ecx"), P(", "), R("ecx")]],
    ["cmp", [R("ecx"), P(", "), N("0x7f")]],
    ["jge", [L("loc_401038")], OG.stop],
    ["inc", [R("ecx")]],
    ["jmp", [L("loc_401016")], OG.stop],
    ["mov", [R("esp"), P(", "), R("ebp")]],
    ["pop", [R("ebp")]],
    ["ret", [], OG.call],
];

const escapeHtml = s => String(s).replace(/[&<>"]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

export async function getImagePng({ title, footer = "" }) {
    const logo = `data:image/png;base64,${readFileSync(`${process.cwd()}/public/logo.png`).toString("base64")}`;
    const size = title.length > 60 ? 44 : title.length > 36 ? 52 : 62; // long titles shrink to fit

    const disasm = OG_DISASM.map(([mn, ops, mncolor]) => `
            <div style="display: flex; font-size: 25px;">
                <span style="color: ${mncolor ?? OG.fg}; width: 90px;">${mn}</span>
                ${ops.map(([text, color]) => `<span style="color: ${color};${text.endsWith(" ") ? " margin-right: 15px;" : ""}">${text.trim()}</span>`).join("")}
            </div>`).join("");

    const MARKUP = html(`
        <div style="width: 100%; height: 100%; display: flex; position: relative; background-color: ${OG.page}; color: ${OG.fg};">
            <div style="display: flex; position: absolute; left: 560px; top: 0; width: 640px; height: 630px;
                        background-image: linear-gradient(to right, ${OG.page}, ${OG.panel} 55%);"></div>
            <div style="display: flex; flex-direction: column; gap: 4px; position: absolute; left: 790px; top: 34px; line-height: 1.5;">
                ${disasm}
            </div>
            <div style="display: flex; flex-direction: column; position: absolute; left: 0; top: 0; width: 820px; height: 630px; padding: 52px 60px 44px 60px;">
                <div style="display: flex; align-items: center;">
                    <img src="${logo}" style="width: 63px; height: 48px;" />
                    <div style="display: flex; font-size: 30px; font-weight: 700; margin-left: 20px;">Dev Blog</div>
                </div>
                <div style="display: flex; flex: 1; align-items: center;">
                    <div style="display: flex; flex-direction: column; width: 640px;">
                        <div style="display: flex; font-size: ${size}px; font-weight: 700; line-height: 1.15; letter-spacing: -1px;">${escapeHtml(title)}</div>
                        <div style="display: flex; width: 80px; height: 6px; background-color: ${OG.primary}; margin-top: 30px;"></div>
                    </div>
                </div>
                <div style="display: flex; flex-direction: column; font-size: 24px; color: ${OG.mutedText};">
                    ${footer ? `<span style="margin-bottom: 6px;">${escapeHtml(footer)}</span>` : ""}
                    <span>blog.redasm.dev</span>
                </div>
            </div>
        </div>
`);

    const FontRegular = readFileSync(`${process.cwd()}/public/fonts/JetBrainsMono-Regular.ttf`);
    const FontBold = readFileSync(`${process.cwd()}/public/fonts/JetBrainsMono-Bold.ttf`);

    const SVG = await satori(MARKUP, {
        width: 1200,
        height: 630,
        fonts: [
            { name: "JetBrainsMono", data: FontRegular, weight: 400 },
            { name: "JetBrainsMono", data: FontBold, weight: 700 },
        ]
    })

    return sharp(Buffer.from(SVG)).png();
}
