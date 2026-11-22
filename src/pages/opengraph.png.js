import { getImagePng } from "../utils.js";
import { SITE_DESCRIPTION, SITE_TAGLINE } from "../consts.ts";

export async function GET() {
    const PNG = await getImagePng({ title: SITE_TAGLINE, footer: SITE_DESCRIPTION });

    return new Response(await PNG.toBuffer(), {
        status: 200,
        headers: {
            "Content-Type": "image/png",
            "Cache-Control": "s-maxage=1, stale-while-revalidate=59",
        }
    });
}
