import { getPosts, getImagePng } from "../../utils.js"

export async function getStaticPaths() {
    return (await getPosts())
        .map(({ id, data }) => ({
            params: { og: id },
            props: {
                title: data.title,
                // footer: `by ${data.author}`, // for guest posts (author in front matter)
            },
        }));
}

export async function GET({ props }) {
    const PNG = await getImagePng(props);

    return new Response(await PNG.toBuffer(), {
        status: 200,
        headers: {
            "Content-Type": "image/png",
            "Cache-Control": "s-maxage=1, stale-while-revalidate=59",
        }
    });
}
