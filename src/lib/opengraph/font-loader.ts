export async function loadGoogleFont(font: string, text: string = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789') {
    const url = `https://fonts.googleapis.com/css2?family=${font}&text=${encodeURIComponent(text)}`;
    const css = await (await fetch(url)).text();
    const resource = css.match(/src: url\((.+)\) format\('(opentype|truetype|woff|woff2)'\)/);

    if (!resource) return null;

    const res = await fetch(resource[1]);
    return res.arrayBuffer();
}
