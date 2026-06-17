import { useState, useCallback } from 'react';
import Cropper, { Area } from 'react-easy-crop';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
    DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ZoomIn, ZoomOut, RotateCcw } from 'lucide-react';

interface ImageCropperProps {
    open: boolean;
    imageSrc: string;
    onCropComplete: (croppedFile: File) => void;
    onCancel: () => void;
    /** Proporção do corte (ex: 5/8 para capa, 1 para perfil). Padrão: 5/8 */
    aspectRatio?: number;
    /** Largura de saída em px. Padrão: 1200 */
    outputWidth?: number;
    /** Altura de saída em px. Padrão: 1920 */
    outputHeight?: number;
    /** Título do modal */
    title?: string;
    /** Descrição do modal */
    description?: string;
    /** Formato circular (para fotos de perfil) */
    cropShape?: 'rect' | 'round';
}

/**
 * Cria um canvas com a área recortada e retorna um File.
 */
async function getCroppedImage(
    imageSrc: string,
    cropArea: Area,
    outputWidth: number,
    outputHeight: number,
): Promise<File> {
    const image = new Image();
    image.crossOrigin = 'anonymous';
    await new Promise<void>((resolve, reject) => {
        image.onload = () => resolve();
        image.onerror = reject;
        image.src = imageSrc;
    });

    const canvas = document.createElement('canvas');
    canvas.width = outputWidth;
    canvas.height = outputHeight;
    const ctx = canvas.getContext('2d')!;

    // Fundo branco (caso a imagem tenha transparência)
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.drawImage(
        image,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        outputWidth,
        outputHeight,
    );

    return new Promise<File>((resolve, reject) => {
        canvas.toBlob(
            (blob) => {
                if (!blob) return reject(new Error('Falha ao gerar imagem'));
                const file = new File([blob], 'imagem-recortada.jpeg', { type: 'image/jpeg' });
                resolve(file);
            },
            'image/jpeg',
            0.92,
        );
    });
}

export default function ImageCropper({
    open,
    imageSrc,
    onCropComplete,
    onCancel,
    aspectRatio = 5 / 8,
    outputWidth = 1600,
    outputHeight = 2560,
    title = 'Recortar Imagem',
    description,
    cropShape = 'rect',
}: ImageCropperProps) {
    const [crop, setCrop] = useState({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
    const [saving, setSaving] = useState(false);

    const descriptionText = description || `Ajuste a imagem na área de corte. Saída: ${outputWidth}×${outputHeight}px.`;

    const onCropChange = useCallback((location: { x: number; y: number }) => {
        setCrop(location);
    }, []);

    const onZoomChange = useCallback((z: number) => {
        setZoom(z);
    }, []);

    const onCropAreaComplete = useCallback((_: Area, croppedPixels: Area) => {
        setCroppedAreaPixels(croppedPixels);
    }, []);

    const handleConfirm = async () => {
        if (!croppedAreaPixels) return;
        setSaving(true);
        try {
            const croppedFile = await getCroppedImage(imageSrc, croppedAreaPixels, outputWidth, outputHeight);
            onCropComplete(croppedFile);
        } catch {
            // Fallback: se falhar, ainda envia sem crop
            onCancel();
        } finally {
            setSaving(false);
        }
    };

    const handleReset = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
    };

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onCancel()}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh] p-0 overflow-hidden">
                <DialogHeader className="px-6 pt-6 pb-2">
                    <DialogTitle>{title}</DialogTitle>
                    <DialogDescription>{descriptionText}</DialogDescription>
                </DialogHeader>

                {/* Área do Cropper */}
                <div className="relative w-full bg-black" style={{ height: '360px' }}>
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={aspectRatio}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={onCropAreaComplete}
                        cropShape={cropShape}
                        showGrid={cropShape === 'rect'}
                        style={{
                            containerStyle: { borderRadius: 0 },
                        }}
                    />
                </div>

                {/* Controles de zoom */}
                <div className="flex items-center justify-center gap-4 px-6 py-3">
                    <button
                        type="button"
                        onClick={() => setZoom((z) => Math.max(1, z - 0.2))}
                        className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                        title="Diminuir zoom"
                    >
                        <ZoomOut className="w-5 h-5" />
                    </button>

                    <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.05}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-40 accent-primary"
                    />

                    <button
                        type="button"
                        onClick={() => setZoom((z) => Math.min(3, z + 0.2))}
                        className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                        title="Aumentar zoom"
                    >
                        <ZoomIn className="w-5 h-5" />
                    </button>

                    <button
                        type="button"
                        onClick={handleReset}
                        className="p-2 rounded-lg text-slate-500 hover:text-slate-800 hover:bg-slate-100 dark:text-slate-400 dark:hover:text-slate-200 dark:hover:bg-slate-800 transition-colors"
                        title="Resetar posição"
                    >
                        <RotateCcw className="w-5 h-5" />
                    </button>
                </div>

                <DialogFooter className="px-6 pb-6">
                    <Button type="button" variant="outline" onClick={onCancel} disabled={saving}>
                        Cancelar
                    </Button>
                    <Button type="button" onClick={handleConfirm} disabled={saving || !croppedAreaPixels}>
                        {saving ? 'Processando...' : 'Confirmar Corte'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
}
