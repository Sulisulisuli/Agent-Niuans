'use client'

import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { TemplateConfig } from '@/lib/opengraph/engine'
import { uploadImage } from '@/app/(dashboard)/settings/templates/upload-image'

interface LayerSettingsProps {
    config: TemplateConfig
    selectedLayerId?: string
    updateConfig: (key: keyof TemplateConfig, value: any) => void
    setSelectedLayerId: (id: string | undefined) => void
}

const TEXT_VARIABLES = [
    { label: 'None (Static)', value: 'none' },
    { label: 'Post Title', value: 'title' },
    { label: 'Post Subtitle', value: 'subtitle' },
    { label: 'Footer / Brand', value: 'footer' },
    { label: 'Author Name', value: 'author' },
    { label: 'Publish Date', value: 'date' },
]

const IMAGE_VARIABLES = [
    { label: 'None (Make Static)', value: 'none' },
    { label: 'Featured Image', value: 'featuredImage' },
]

export function LayerSettings({ config, selectedLayerId, updateConfig, setSelectedLayerId }: LayerSettingsProps) {
    return (
        <div className="border border-black p-4 space-y-4 bg-gray-50">
            <Label className="text-lg font-bold">Layers</Label>

            {/* Background Upload */}
            <div className="space-y-2">
                <Label className="text-xs">Background Image</Label>
                <div className="flex flex-col gap-2">
                    <Input
                        id="bg-image-upload"
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={async (e) => {
                            const file = e.target.files?.[0]
                            if (!file) return

                            const btn = document.getElementById('bg-upload-btn');
                            if (btn) btn.innerText = "Uploading...";

                            try {
                                const formData = new FormData()
                                formData.append('file', file)
                                const res = await uploadImage(formData)
                                if (res.error) alert(res.error)
                                else if (res.publicUrl) updateConfig('backgroundImage', res.publicUrl)
                            } catch (err) {
                                console.error(err)
                                alert('Upload failed')
                            } finally {
                                if (btn) btn.innerText = "Choose Background Image";
                            }
                        }}
                    />
                    <Button
                        id="bg-upload-btn"
                        variant="outline"
                        className="w-full text-xs h-8 border-black rounded-none"
                        onClick={() => document.getElementById('bg-image-upload')?.click()}
                    >
                        Choose Background Image
                    </Button>
                    <div className="flex gap-2">
                        <div className="flex-1 bg-gray-100 p-2 text-[10px] break-all border border-gray-300">
                            {config.backgroundImage || 'No image selected'}
                        </div>
                        {config.backgroundImage && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => updateConfig('backgroundImage', undefined)}
                                className="h-auto p-2 text-xs text-red-500 hover:text-red-700 border-black rounded-none"
                            >
                                Clear
                            </Button>
                        )}
                    </div>
                    <Input
                        value={config.backgroundImage || ''}
                        onChange={(e) => updateConfig('backgroundImage', e.target.value)}
                        placeholder="Or paste URL..."
                        className="rounded-none border-black text-xs h-7"
                    />
                    <div className="flex items-center gap-2">
                        <span className="text-[10px]">Z-Index:</span>
                        <Input
                            type="number"
                            value={config.backgroundZIndex || 0}
                            onChange={(e) => updateConfig('backgroundZIndex', parseInt(e.target.value) || 0)}
                            className="h-6 w-20 text-xs rounded-none border-black"
                        />
                    </div>
                </div>
            </div>

            <div className="h-px bg-black/20 my-2" />

            {/* Layer List */}
            <div className="space-y-2">
                {config.layers?.map((layer, index) => (
                    <div
                        key={layer.id}
                        className={`border p-2 text-xs relative group transition-colors ${selectedLayerId === layer.id ? 'border-[#eb4f27] bg-[#fff5f2]' : 'border-black bg-white'}`}
                        onClick={() => setSelectedLayerId(layer.id)}
                    >
                        <div className="flex justify-between items-center mb-2">
                            <span className="font-bold uppercase">{layer.type}</span>
                            <button
                                onClick={(e) => {
                                    e.stopPropagation();
                                    const newLayers = config.layers ? [...config.layers] : [];
                                    newLayers.splice(index, 1);
                                    updateConfig('layers', newLayers);
                                    if (selectedLayerId === layer.id) setSelectedLayerId(undefined);
                                }}
                                className="text-red-500 hover:text-red-700"
                            >
                                ×
                            </button>
                        </div>

                        <div className="grid grid-cols-4 gap-2">
                            <div>
                                <Label className="text-[10px]">X (px)</Label>
                                <Input
                                    type="number"
                                    value={layer.x}
                                    onChange={e => {
                                        const newLayers = [...(config.layers || [])];
                                        newLayers[index] = { ...newLayers[index], x: parseInt(e.target.value) || 0 };
                                        updateConfig('layers', newLayers);
                                    }}
                                    className="h-6 text-xs rounded-none border-black"
                                />
                            </div>
                            <div>
                                <Label className="text-[10px]">Y (px)</Label>
                                <Input
                                    type="number"
                                    value={layer.y}
                                    onChange={e => {
                                        const newLayers = [...(config.layers || [])];
                                        newLayers[index] = { ...newLayers[index], y: parseInt(e.target.value) || 0 };
                                        updateConfig('layers', newLayers);
                                    }}
                                    className="h-6 text-xs rounded-none border-black"
                                />
                            </div>
                            <div>
                                <Label className="text-[10px]">Z-Index</Label>
                                <Input
                                    type="number"
                                    value={layer.styles.zIndex || 1}
                                    onChange={e => {
                                        const newLayers = [...(config.layers || [])];
                                        newLayers[index] = {
                                            ...newLayers[index],
                                            styles: { ...newLayers[index].styles, zIndex: parseInt(e.target.value) || 1 }
                                        };
                                        updateConfig('layers', newLayers);
                                    }}
                                    className="h-6 text-xs rounded-none border-black"
                                />
                            </div>
                            <div>
                                <Label className="text-[10px]">Rotation (°)</Label>
                                <Input
                                    type="number"
                                    value={layer.styles.rotation || 0}
                                    onChange={e => {
                                        const newLayers = [...(config.layers || [])];
                                        newLayers[index] = {
                                            ...newLayers[index],
                                            styles: { ...newLayers[index].styles, rotation: parseInt(e.target.value) || 0 }
                                        };
                                        updateConfig('layers', newLayers);
                                    }}
                                    className="h-6 text-xs rounded-none border-black"
                                />
                            </div>
                            {layer.type === 'text' && (
                                <>
                                    <div className="col-span-4 grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-[10px]">Width</Label>
                                            <Input
                                                type="number"
                                                value={layer.width || 0}
                                                onChange={e => {
                                                    const newLayers = [...(config.layers || [])];
                                                    newLayers[index] = { ...newLayers[index], width: parseInt(e.target.value) || 0 };
                                                    updateConfig('layers', newLayers);
                                                }}
                                                className="h-6 text-xs rounded-none border-black"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[10px]">Height</Label>
                                            <Input
                                                type="number"
                                                value={layer.height || 0}
                                                onChange={e => {
                                                    const newLayers = [...(config.layers || [])];
                                                    newLayers[index] = { ...newLayers[index], height: parseInt(e.target.value) || 0 };
                                                    updateConfig('layers', newLayers);
                                                }}
                                                className="h-6 text-xs rounded-none border-black"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-4">
                                        <Label className="text-[10px]">Data Source</Label>
                                        <Select
                                            value={layer.variableId || 'none'}
                                            onValueChange={(v) => {
                                                const newLayers = [...(config.layers || [])];
                                                newLayers[index] = { ...newLayers[index], variableId: v === 'none' ? undefined : v };
                                                updateConfig('layers', newLayers);
                                            }}
                                        >
                                            <SelectTrigger className="h-6 text-xs rounded-none border-black">
                                                <SelectValue placeholder="Static Text" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {TEXT_VARIABLES.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="col-span-4">
                                        <Label className="text-[10px]">Content (Static Fallback)</Label>
                                        <Input
                                            value={layer.content}
                                            onChange={e => {
                                                const newLayers = [...(config.layers || [])];
                                                newLayers[index] = { ...newLayers[index], content: e.target.value };
                                                updateConfig('layers', newLayers);
                                            }}
                                            className="h-6 text-xs rounded-none border-black"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <Label className="text-[10px]">Size</Label>
                                        <Input
                                            type="number"
                                            value={layer.styles.fontSize}
                                            onChange={e => {
                                                const newLayers = [...(config.layers || [])];
                                                newLayers[index] = { ...newLayers[index], styles: { ...newLayers[index].styles, fontSize: parseInt(e.target.value) } };
                                                updateConfig('layers', newLayers);
                                            }}
                                            className="h-6 text-xs rounded-none border-black"
                                        />
                                    </div>
                                    <div className="col-span-1">
                                        <Label className="text-[10px]">Color</Label>
                                        <Input
                                            type="color"
                                            value={layer.styles.color}
                                            onChange={e => {
                                                const newLayers = [...(config.layers || [])];
                                                newLayers[index] = { ...newLayers[index], styles: { ...newLayers[index].styles, color: e.target.value } };
                                                updateConfig('layers', newLayers);
                                            }}
                                            className="h-6 w-full p-0 rounded-none border-black"
                                        />
                                    </div>
                                    <div className="col-span-1 flex items-end">
                                        <div className="flex items-center space-x-2 h-6">
                                            <input
                                                type="checkbox"
                                                id={`autofit-${layer.id}`}
                                                checked={layer.styles.autoFit || false}
                                                onChange={e => {
                                                    const newLayers = [...(config.layers || [])];
                                                    newLayers[index] = {
                                                        ...newLayers[index],
                                                        styles: { ...newLayers[index].styles, autoFit: e.target.checked }
                                                    };
                                                    updateConfig('layers', newLayers);
                                                }}
                                                className="h-4 w-4 rounded border-gray-300"
                                            />
                                            <Label htmlFor={`autofit-${layer.id}`} className="text-[10px] cursor-pointer">Auto Fit</Label>
                                        </div>
                                    </div>
                                </>
                            )}

                            {layer.type === 'image' && (
                                <>
                                    <div className="col-span-4">
                                        <Label className="text-[10px] block mb-1">Data Source</Label>
                                        <Select
                                            value={layer.variableId || 'none'}
                                            onValueChange={(v) => {
                                                const newLayers = [...(config.layers || [])];
                                                newLayers[index] = { ...newLayers[index], variableId: v === 'none' ? undefined : v };
                                                updateConfig('layers', newLayers);
                                            }}
                                        >
                                            <SelectTrigger className="h-6 text-xs rounded-none border-black w-full">
                                                <SelectValue placeholder="Static Image" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                {IMAGE_VARIABLES.map(opt => (
                                                    <SelectItem key={opt.value} value={opt.value}>
                                                        {opt.label}
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    <div className="col-span-4 flex items-center space-x-2 mt-2">
                                        <input
                                            type="checkbox"
                                            id={`uploadable-${layer.id}`}
                                            checked={layer.isUploadable !== false}
                                            onChange={e => {
                                                const newLayers = [...(config.layers || [])];
                                                newLayers[index] = { ...newLayers[index], isUploadable: e.target.checked };
                                                updateConfig('layers', newLayers);
                                            }}
                                            className="h-4 w-4 rounded border-gray-300"
                                        />
                                        <Label htmlFor={`uploadable-${layer.id}`} className="text-[10px] cursor-pointer">Allow Manual Uploads</Label>
                                    </div>

                                    {!layer.variableId && (
                                        <div className="col-span-4 grid grid-cols-2 gap-2">
                                            <div className="col-span-2">
                                                <Label className="text-[10px]">Upload Image (Static)</Label>
                                                <div className="flex items-center gap-2">
                                                    <Input
                                                        id={`file-upload-${index}`}
                                                        type="file"
                                                        className="hidden"
                                                        accept="image/*"
                                                        onChange={async (e) => {
                                                            const file = e.target.files?.[0]
                                                            if (file) {
                                                                try {
                                                                    const formData = new FormData()
                                                                    formData.append('file', file)
                                                                    const res = await uploadImage(formData)
                                                                    if (res.error) alert(res.error)
                                                                    else if (res.publicUrl) {
                                                                        const newLayers = [...(config.layers || [])];
                                                                        newLayers[index] = { ...newLayers[index], src: res.publicUrl };
                                                                        updateConfig('layers', newLayers);
                                                                    }
                                                                } catch (err) {
                                                                    console.error(err)
                                                                }
                                                            }
                                                        }}
                                                    />
                                                    <Button
                                                        type="button"
                                                        variant="secondary"
                                                        size="sm"
                                                        className="w-full text-xs h-8 border border-gray-300 rounded-none bg-gray-50 hover:bg-gray-100"
                                                        onClick={() => document.getElementById(`file-upload-${index}`)?.click()}
                                                    >
                                                        Choose File...
                                                    </Button>
                                                </div>
                                                {layer.src && !layer.variableId && (
                                                    <div className="text-[10px] text-gray-500 mt-1 truncate">
                                                        Current: {...layer.src.split('/').slice(-1)}
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    )}

                                    <div className="col-span-4 grid grid-cols-2 gap-2 mt-2">
                                        <div>
                                            <Label className="text-[10px]">Width</Label>
                                            <Input
                                                type="number"
                                                value={layer.width || 0}
                                                onChange={e => {
                                                    const newLayers = [...(config.layers || [])];
                                                    newLayers[index] = { ...newLayers[index], width: parseInt(e.target.value) || 0 };
                                                    updateConfig('layers', newLayers);
                                                }}
                                                className="h-6 text-xs rounded-none border-black"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[10px]">Height</Label>
                                            <Input
                                                type="number"
                                                value={layer.height || 0}
                                                onChange={e => {
                                                    const newLayers = [...(config.layers || [])];
                                                    newLayers[index] = { ...newLayers[index], height: parseInt(e.target.value) || 0 };
                                                    updateConfig('layers', newLayers);
                                                }}
                                                className="h-6 text-xs rounded-none border-black"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[10px]">Radius</Label>
                                            <Input
                                                type="number"
                                                value={layer.styles.borderRadius || 0}
                                                onChange={e => {
                                                    const newLayers = [...(config.layers || [])];
                                                    newLayers[index] = { ...newLayers[index], styles: { ...newLayers[index].styles, borderRadius: parseInt(e.target.value) || 0 } };
                                                    updateConfig('layers', newLayers);
                                                }}
                                                className="h-6 text-xs rounded-none border-black"
                                            />
                                        </div>
                                    </div>

                                    <div className="col-span-4 mt-2 border-t border-black/10 pt-2">
                                        <div className="flex items-center space-x-2 mb-2">
                                            <Switch
                                                id={`uploadable-${layer.id}`}
                                                checked={!!layer.isUploadable}
                                                onCheckedChange={(checked) => {
                                                    const newLayers = [...(config.layers || [])];
                                                    newLayers[index] = { ...newLayers[index], isUploadable: checked };
                                                    updateConfig('layers', newLayers);
                                                }}
                                            />
                                            <Label htmlFor={`uploadable-${layer.id}`} className="text-[10px] cursor-pointer">Allow User Upload (Interactive)</Label>
                                        </div>

                                        {layer.isUploadable && (
                                            <div className="ml-8">
                                                <Label className="text-[10px]">Placeholder Label</Label>
                                                <Input
                                                    value={layer.placeholderText || ''}
                                                    onChange={e => {
                                                        const newLayers = [...(config.layers || [])];
                                                        newLayers[index] = { ...newLayers[index], placeholderText: e.target.value };
                                                        updateConfig('layers', newLayers);
                                                    }}
                                                    className="h-6 text-xs rounded-none border-black"
                                                    placeholder="Click to Upload"
                                                />
                                            </div>
                                        )}
                                    </div>
                                </>
                            )}

                            {layer.type === 'svg' && (
                                <>
                                    <div className="col-span-4">
                                        <Label className="text-[10px]">SVG Code</Label>
                                        <Textarea
                                            value={layer.content}
                                            onChange={e => {
                                                const newLayers = [...(config.layers || [])];
                                                newLayers[index] = { ...newLayers[index], content: e.target.value };
                                                updateConfig('layers', newLayers);
                                            }}
                                            className="min-h-[100px] text-[10px] font-mono rounded-none border-black p-2"
                                            placeholder="<svg>...</svg>"
                                        />
                                    </div>
                                    <div className="col-span-4 grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-[10px]">Width</Label>
                                            <Input
                                                type="number"
                                                value={layer.width}
                                                onChange={e => {
                                                    const newLayers = [...(config.layers || [])];
                                                    newLayers[index] = { ...newLayers[index], width: parseInt(e.target.value) || 0 };
                                                    updateConfig('layers', newLayers);
                                                }}
                                                className="h-6 text-xs rounded-none border-black"
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-[10px]">Height</Label>
                                            <Input
                                                type="number"
                                                value={layer.height}
                                                onChange={e => {
                                                    const newLayers = [...(config.layers || [])];
                                                    newLayers[index] = { ...newLayers[index], height: parseInt(e.target.value) || 0 };
                                                    updateConfig('layers', newLayers);
                                                }}
                                                className="h-6 text-xs rounded-none border-black"
                                            />
                                        </div>
                                    </div>
                                </>
                            )}

                            {layer.type === 'rect' && (
                                <>
                                    <div className="col-span-2 space-y-2">
                                        <div className="flex gap-2">
                                            <div className="flex-1">
                                                <Label className="text-[10px]">Width</Label>
                                                <Input
                                                    type="number"
                                                    value={layer.width}
                                                    onChange={e => {
                                                        const newLayers = [...(config.layers || [])];
                                                        newLayers[index] = { ...newLayers[index], width: parseInt(e.target.value) || 0 };
                                                        updateConfig('layers', newLayers);
                                                    }}
                                                    className="h-6 text-xs rounded-none border-black"
                                                />
                                            </div>
                                            <div className="flex-1">
                                                <Label className="text-[10px]">Height</Label>
                                                <Input
                                                    type="number"
                                                    value={layer.height}
                                                    onChange={e => {
                                                        const newLayers = [...(config.layers || [])];
                                                        newLayers[index] = { ...newLayers[index], height: parseInt(e.target.value) || 0 };
                                                        updateConfig('layers', newLayers);
                                                    }}
                                                    className="h-6 text-xs rounded-none border-black"
                                                />
                                            </div>
                                        </div>
                                    </div>

                                    <div>
                                        <Label className="text-[10px]">Color</Label>
                                        <Input
                                            type="color"
                                            value={layer.styles.backgroundColor || '#000000'}
                                            onChange={e => {
                                                const newLayers = [...(config.layers || [])];
                                                newLayers[index] = { ...newLayers[index], styles: { ...newLayers[index].styles, backgroundColor: e.target.value } };
                                                updateConfig('layers', newLayers);
                                            }}
                                            className="h-6 w-full p-0 rounded-none border-black"
                                        />
                                    </div>
                                    <div>
                                        <Label className="text-[10px]">Radius</Label>
                                        <Input
                                            type="number"
                                            value={layer.styles.borderRadius || 0}
                                            onChange={e => {
                                                const newLayers = [...(config.layers || [])];
                                                newLayers[index] = { ...newLayers[index], styles: { ...newLayers[index].styles, borderRadius: parseInt(e.target.value) || 0 } };
                                                updateConfig('layers', newLayers);
                                            }}
                                            className="h-6 text-xs rounded-none border-black"
                                        />
                                    </div>
                                </>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <div className="grid grid-cols-4 gap-2">
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs rounded-none border-black border-dashed flex items-center justify-center gap-1"
                    onClick={() => {
                        const newLayers = [...(config.layers || [])];
                        newLayers.push({
                            id: Math.random().toString(),
                            type: 'text',
                            x: 100,
                            y: 100,
                            width: 300,
                            height: 50,
                            styles: { color: '#000000', fontSize: 32, fontWeight: 'bold' },
                            content: 'New Text'
                        });
                        updateConfig('layers', newLayers);
                    }}
                >
                    + Text
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs rounded-none border-black border-dashed flex items-center justify-center gap-1"
                    onClick={() => {
                        const newLayers = [...(config.layers || [])];
                        newLayers.push({
                            id: Math.random().toString(),
                            type: 'image',
                            x: 150,
                            y: 150,
                            width: 200,
                            height: 200,
                            styles: { borderRadius: 0 },
                            src: 'https://placehold.co/400?text=Img',
                            isUploadable: true
                        });
                        updateConfig('layers', newLayers);
                    }}
                >
                    + Image
                </Button>
                <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs rounded-none border-black border-dashed flex items-center justify-center gap-1"
                    onClick={() => {
                        const newLayers = [...(config.layers || [])];
                        newLayers.push({
                            id: Math.random().toString(),
                            type: 'rect',
                            x: 200,
                            y: 200,
                            width: 100,
                            height: 100,
                            styles: { backgroundColor: '#e5e7eb', borderRadius: 0 },
                        });
                        updateConfig('layers', newLayers);
                    }}
                >
                    + Shape
                </Button>

                <Button
                    variant="outline"
                    size="sm"
                    className="w-full text-xs rounded-none border-black border-dashed flex items-center justify-center gap-1"
                    onClick={() => {
                        const newLayers = [...(config.layers || [])];
                        newLayers.push({
                            id: Math.random().toString(),
                            type: 'svg',
                            x: 200,
                            y: 200,
                            width: 100,
                            height: 100,
                            styles: { color: '#000000' },
                            content: '<svg viewBox="0 0 100 100"><circle cx="50" cy="50" r="50" fill="currentColor"/></svg>'
                        });
                        updateConfig('layers', newLayers);
                    }}
                >
                    + SVG
                </Button>
            </div>
        </div>
    )
}
