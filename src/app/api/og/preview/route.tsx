import { ImageResponse } from '@vercel/og';
import { getTemplateElement, TemplateConfig, ContentData } from '@/lib/opengraph/engine';
import { loadGoogleFont } from '@/lib/opengraph/font-loader';

export const runtime = 'edge';

export async function POST(req: Request) {
    try {
        const { config, content } = await req.json() as { config: TemplateConfig; content: ContentData };

        if (!config || !content) {
            return new Response('Missing config or content', { status: 400 });
        }

        const fontName = config.fontFamily || 'Inter';
        const fontData = await loadGoogleFont(fontName, content.title + (content.subtitle || ''));

        const element = getTemplateElement(config, content);

        return new ImageResponse(
            element as any,
            {
                width: config.dimensions?.width || 1200,
                height: config.dimensions?.height || 630,
                fonts: fontData ? [
                    {
                        name: fontName,
                        data: fontData,
                        style: 'normal',
                    },
                ] : [],
            }
        );
    } catch (e: any) {
        console.error(e);
        return new Response(`Failed to generate image: ${e.message}`, { status: 500 });
    }
}
