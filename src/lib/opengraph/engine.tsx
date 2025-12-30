import { ReactNode } from 'react';
import { ICONS } from './icons';

export interface TemplateConfig {
    layout: 'simple-centered' | 'modern-split' | 'hero-image' | 'neon-card' | 'custom';
    primaryColor: string;
    backgroundColor: string;
    textColor: string;
    fontFamily: string;
    showIcon?: boolean;
    iconName?: string; // e.g. "Shield", "Zap"
    label?: string; // Changed to optional to avoid issues with older templates or partial updates

    // Format / Dimensions
    dimensions?: {
        width: number;
        height: number;
        label: string;
    };

    // Visual Designer Support
    backgroundImage?: string;
    backgroundZIndex?: number;
    layers?: TemplateElement[];
}

export type ElementType = 'text' | 'image' | 'rect' | 'icon' | 'svg';

export interface TemplateElement {
    id: string;
    type: ElementType;
    x: number; // px relative to canvas
    y: number; // px relative to canvas
    width?: number; // px
    height?: number; // px
    styles: {
        backgroundColor?: string;
        color?: string;
        fontSize?: number;
        fontWeight?: string;
        textAlign?: 'left' | 'center' | 'right';
        borderRadius?: number;
        zIndex?: number;
        autoFit?: boolean;
        rotation?: number;
    };
    content?: string; // For text
    src?: string; // For images
    iconName?: string; // For icons
    variableId?: string; // Dynamic Data Binding
}

export interface ContentData {
    title: string;
    subtitle?: string;
    footer?: string;
    // Dynamic Fields
    author?: string;
    authorAvatar?: string; // URL
    date?: string;
    featuredImage?: string; // URL
}

// --- Icons Helper ---
const Icon = ({ name, size, color }: { name?: string, size: number, color: string }) => {
    if (!name || !ICONS[name]) return null;
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
        >
            <path d={ICONS[name]} fill="currentColor" stroke="none" />
        </svg>
    );
};

// --- Layouts ---

const SimpleCentered = ({ config, content }: { config: TemplateConfig; content: ContentData }) => (
    <div
        style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            backgroundColor: config.backgroundColor,
            color: config.textColor,
            fontFamily: config.fontFamily,
            padding: '40px',
        }}
    >
        {config.showIcon && config.iconName && (
            <div style={{ marginBottom: 20, color: config.primaryColor, display: 'flex' }}>
                <Icon name={config.iconName} size={80} color={config.primaryColor} />
            </div>
        )}
        <h1 style={{ fontSize: 60, fontWeight: 'bold', textAlign: 'center', margin: 0 }}>
            {content.title}
        </h1>
        {content.subtitle && (
            <p style={{ fontSize: 30, opacity: 0.8, marginTop: 20, textAlign: 'center' }}>
                {content.subtitle}
            </p>
        )}
        {content.footer && (
            <div style={{ position: 'absolute', bottom: 40, fontSize: 20, opacity: 0.6 }}>
                {content.footer}
            </div>
        )}
    </div>
);

const ModernSplit = ({ config, content }: { config: TemplateConfig; content: ContentData }) => (
    <div
        style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'row',
            backgroundColor: config.backgroundColor,
            color: config.textColor,
            fontFamily: config.fontFamily,
        }}
    >
        <div style={{
            flex: 1,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            padding: '60px',
        }}>
            <h1 style={{ fontSize: 50, fontWeight: 'bold', margin: '0 0 20px 0', lineHeight: 1.2 }}>
                {content.title}
            </h1>
            {content.subtitle && (
                <p style={{ fontSize: 24, margin: 0, color: config.primaryColor }}>
                    {content.subtitle}
                </p>
            )}
        </div>
        <div style={{
            width: '30%',
            backgroundColor: config.primaryColor,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'white',
        }}>
            {config.showIcon && config.iconName ? (
                <Icon name={config.iconName} size={120} color="white" />
            ) : (
                <div style={{ fontSize: 100 }}>✦</div>
            )}
        </div>
        {content.footer && (
            <div style={{ position: 'absolute', bottom: 30, left: 60, fontSize: 16, opacity: 0.4 }}>
                {content.footer}
            </div>
        )}
    </div>
);


// --- Factory ---

const HeroImage = ({ config, content }: { config: TemplateConfig; content: ContentData }) => (
    <div
        style={{
            height: '100%',
            width: '100%',
            display: 'flex',
            flexDirection: 'column',
            backgroundColor: config.backgroundColor,
            color: config.textColor,
            fontFamily: config.fontFamily,
        }}
    >
        {/* Placeholder for Image */}
        <div style={{
            flex: 1,
            backgroundColor: '#e5e5e5',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
        }}>
            <div style={{
                fontSize: 24,
                color: '#a3a3a3',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center'
            }}>
                <div style={{ fontSize: 48, marginBottom: 10 }}>🖼️</div>
                <div>Image Placeholder</div>
            </div>
        </div>

        <div style={{
            padding: '40px 60px',
            backgroundColor: config.backgroundColor,
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            borderTop: `4px solid ${config.primaryColor}`
        }}>
            <div style={{ display: 'flex', alignItems: 'center', marginBottom: 16 }}>
                {config.showIcon && config.iconName && (
                    <div style={{ marginRight: 16, color: config.primaryColor, display: 'flex' }}>
                        <Icon name={config.iconName} size={32} color={config.primaryColor} />
                    </div>
                )}
                <h1 style={{ fontSize: 40, fontWeight: 'bold', margin: 0 }}>
                    {content.title}
                </h1>
            </div>

            {content.subtitle && (
                <p style={{ fontSize: 24, opacity: 0.8, margin: 0 }}>
                    {content.subtitle}
                </p>
            )}

            {content.footer && (
                <div style={{ marginTop: 24, fontSize: 16, opacity: 0.5 }}>
                    {content.footer}
                </div>
            )}
        </div>
    </div>
);

function getFittingFontSize(text: string, maxWidth: number, startFontSize: number): number {
    if (!maxWidth || maxWidth <= 0) return startFontSize;

    // Heuristic: Average character width is ~0.6 of font size for standard sans-serif fonts
    const charRatio = 0.6;
    const estimatedWidth = text.length * (startFontSize * charRatio);

    if (estimatedWidth > maxWidth) {
        // Calculate new font size: maxWidth / (length * ratio)
        const newFontSize = maxWidth / (text.length * charRatio);
        // Clamp to minimum 12px to avoid eligibility issues
        return Math.max(12, Math.floor(newFontSize));
    }

    return startFontSize;
}

// --- CustomLayout ---
export const CustomLayout = ({ config, content, onLayerSelect, selectedLayerId }: { config: TemplateConfig; content: ContentData; onLayerSelect?: (id: string) => void; selectedLayerId?: string }) => (
    <div
        style={{
            height: '100%',
            width: '100%',
            position: 'relative',
            backgroundColor: config.backgroundColor,
            // backgroundImage moved to child element for z-index control
            fontFamily: config.fontFamily,
            display: 'flex', // Needed for Satori to render children correctly even if absolute
            overflow: 'hidden', // Clip content
        }}
    >
        {config.backgroundImage && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
                src={config.backgroundImage}
                alt=""
                style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    objectFit: 'cover',
                    zIndex: config.backgroundZIndex || 0,
                    pointerEvents: 'none',
                }}
            />
        )}

        {config.layers?.map((layer) => (
            <div
                key={layer.id}
                onClick={(e) => {
                    e.stopPropagation();
                    onLayerSelect?.(layer.id);
                }}
                style={{
                    position: 'absolute',
                    left: layer.x,
                    top: layer.y,
                    width: layer.width,
                    height: layer.height,
                    backgroundColor: layer.styles.backgroundColor,
                    color: layer.styles.color,
                    fontSize: (layer.type === 'text' && layer.styles.autoFit && layer.width)
                        ? getFittingFontSize(
                            (layer.variableId ? (content[layer.variableId as keyof ContentData] as string) : layer.content) || '',
                            layer.width,
                            layer.styles.fontSize || 32
                        )
                        : layer.styles.fontSize,
                    fontWeight: layer.styles.fontWeight,
                    textAlign: layer.styles.textAlign,
                    borderRadius: layer.styles.borderRadius,
                    display: 'flex',
                    alignItems: 'center', // Default vertical center
                    justifyContent: layer.styles.textAlign === 'center' ? 'center' : layer.styles.textAlign === 'right' ? 'flex-end' : 'flex-start',
                    whiteSpace: 'pre-wrap', // Allow multiline
                    cursor: onLayerSelect ? 'move' : 'default', // Indicate draggable
                    outline: selectedLayerId === layer.id ? '2px solid #eb4f27' : 'none', // Selection ring
                    zIndex: selectedLayerId === layer.id ? 1000 : (layer.styles.zIndex || 1), // Bring to front if selected
                    transform: layer.styles.rotation ? `rotate(${layer.styles.rotation}deg)` : undefined,
                }}
                // Data attributes for drag handling in parent
                data-layer-id={layer.id}
            >
                {layer.type === 'text' && (
                    (layer.variableId && content[layer.variableId as keyof ContentData] ? content[layer.variableId as keyof ContentData] : layer.content)
                )}
                {layer.type === 'image' && (
                    <img
                        src={(layer.variableId && content[layer.variableId as keyof ContentData] ? content[layer.variableId as keyof ContentData] : layer.src) as string}
                        alt=""
                        style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: layer.styles.borderRadius, pointerEvents: 'none' }}
                    />
                )}
                {layer.type === 'svg' && layer.content && (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                        src={`data:image/svg+xml;utf8,${encodeURIComponent(layer.content)}`}
                        alt=""
                        style={{ width: '100%', height: '100%', pointerEvents: 'none' }}
                    />
                )}
                {layer.type === 'icon' && layer.iconName && (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', pointerEvents: 'none' }}>
                        <Icon name={layer.iconName} size={Math.min(layer.width || 32, layer.height || 32)} color={layer.styles.color || '#000'} />
                    </div>
                )}
            </div>
        ))}
    </div>
);

export function getTemplateElement(config: TemplateConfig, content: ContentData): ReactNode {
    if (config.layout === 'custom') {
        return <CustomLayout config={config} content={content} />;
    }

    switch (config.layout) {
        case 'modern-split':
            return <ModernSplit config={config} content={content} />;
        case 'hero-image':
            return <HeroImage config={config} content={content} />;
        case 'simple-centered':
        default:
            return <SimpleCentered config={config} content={content} />;
    }
}
