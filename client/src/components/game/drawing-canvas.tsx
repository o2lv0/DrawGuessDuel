import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Trash2, PaintBucket, Pencil, Undo2, Redo2, Palette } from "lucide-react";
import { DRAWING_COLORS, BRUSH_SIZES, type DrawingStroke } from "@shared/schema";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { ColorPickerDialog } from "./color-picker-dialog";

interface DrawingCanvasProps {
  strokes: DrawingStroke[];
  onDraw: (stroke: DrawingStroke) => void;
  onClear: () => void;
  onUndo: () => void;
  onRedo: () => void;
  canUndo: boolean;
  canRedo: boolean;
  isDrawer: boolean;
}

export function DrawingCanvas({ strokes, onDraw, onClear, onUndo, onRedo, canUndo, canRedo, isDrawer }: DrawingCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [currentColor, setCurrentColor] = useState(DRAWING_COLORS[6].value); // Black
  const [currentSize, setCurrentSize] = useState(BRUSH_SIZES[1].value); // Medium
  const [showClearDialog, setShowClearDialog] = useState(false);
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [toolMode, setToolMode] = useState<"draw" | "fill" | "eyedropper">("draw"); // Drawing tool mode

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = "#ffffff";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Redraw all strokes
    ctx.lineCap = "round";
    ctx.lineJoin = "round";

    let lastStroke: DrawingStroke | null = null;

    strokes.forEach((stroke) => {
      if (stroke.isFill) {
        // Handle fill operation
        floodFill(ctx, Math.floor(stroke.x), Math.floor(stroke.y), stroke.color);
      } else if (stroke.isDrawing && lastStroke) {
        // Handle drawing stroke
        ctx.beginPath();
        ctx.moveTo(lastStroke.x, lastStroke.y);
        ctx.lineTo(stroke.x, stroke.y);
        ctx.strokeStyle = stroke.color;
        ctx.lineWidth = stroke.size;
        ctx.stroke();
      }
      lastStroke = stroke;
    });
  }, [strokes]);

  // Flood fill algorithm for filling enclosed areas
  const floodFill = (ctx: CanvasRenderingContext2D, startX: number, startY: number, fillColor: string) => {
    const canvas = ctx.canvas;
    const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // Convert hex color to RGB
    const hexToRgb = (hex: string) => {
      const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
      return result ? {
        r: parseInt(result[1], 16),
        g: parseInt(result[2], 16),
        b: parseInt(result[3], 16)
      } : { r: 0, g: 0, b: 0 };
    };
    
    const fillRGB = hexToRgb(fillColor);
    
    // Get color at starting point
    const getPixelIndex = (x: number, y: number) => (y * canvas.width + x) * 4;
    const startIndex = getPixelIndex(startX, startY);
    const targetR = pixels[startIndex];
    const targetG = pixels[startIndex + 1];
    const targetB = pixels[startIndex + 2];
    
    // Don't fill if target color is same as fill color
    if (targetR === fillRGB.r && targetG === fillRGB.g && targetB === fillRGB.b) {
      return;
    }
    
    // Use stack-based flood fill to avoid recursion depth issues
    const stack: [number, number][] = [[startX, startY]];
    const visited = new Set<string>();
    
    while (stack.length > 0) {
      const [x, y] = stack.pop()!;
      
      // Check bounds
      if (x < 0 || x >= canvas.width || y < 0 || y >= canvas.height) continue;
      
      // Check if already visited
      const key = `${x},${y}`;
      if (visited.has(key)) continue;
      visited.add(key);
      
      const index = getPixelIndex(x, y);
      const r = pixels[index];
      const g = pixels[index + 1];
      const b = pixels[index + 2];
      
      // Check if pixel matches target color
      if (r === targetR && g === targetG && b === targetB) {
        // Fill pixel
        pixels[index] = fillRGB.r;
        pixels[index + 1] = fillRGB.g;
        pixels[index + 2] = fillRGB.b;
        pixels[index + 3] = 255; // Alpha
        
        // Add neighbors to stack
        stack.push([x + 1, y]);
        stack.push([x - 1, y]);
        stack.push([x, y + 1]);
        stack.push([x, y - 1]);
      }
    }
    
    // Put modified image data back
    ctx.putImageData(imageData, 0, 0);
  };

  const getCanvasCoordinates = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };

    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;

    if ('touches' in e) {
      const touch = e.touches[0];
      return {
        x: (touch.clientX - rect.left) * scaleX,
        y: (touch.clientY - rect.top) * scaleY,
      };
    } else {
      return {
        x: (e.clientX - rect.left) * scaleX,
        y: (e.clientY - rect.top) * scaleY,
      };
    }
  };

  // Get color at pixel for eyedropper
  const getColorAtPixel = (x: number, y: number): string | null => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    
    const ctx = canvas.getContext("2d");
    if (!ctx) return null;
    
    const pixel = ctx.getImageData(Math.floor(x), Math.floor(y), 1, 1).data;
    const r = pixel[0];
    const g = pixel[1];
    const b = pixel[2];
    
    // Convert RGB to HEX
    return "#" + [r, g, b].map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  };

  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawer) return;
    e.preventDefault();
    
    const { x, y } = getCanvasCoordinates(e);
    
    if (toolMode === "eyedropper") {
      // Eyedropper mode: pick color at click location
      const pickedColor = getColorAtPixel(x, y);
      if (pickedColor) {
        setCurrentColor(pickedColor);
      }
      setToolMode("draw"); // Return to draw mode after picking
    } else if (toolMode === "fill") {
      // Fill mode: perform flood fill at click location
      onDraw({ x, y, color: currentColor, size: currentSize, isDrawing: false, isFill: true });
    } else {
      // Draw mode: start drawing
      setIsDrawing(true);
      onDraw({ x, y, color: currentColor, size: currentSize, isDrawing: false });
    }
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawer || !isDrawing) return;
    e.preventDefault();
    const { x, y } = getCanvasCoordinates(e);
    onDraw({ x, y, color: currentColor, size: currentSize, isDrawing: true });
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const handleClear = () => {
    setShowClearDialog(false);
    onClear();
  };

  return (
    <Card className="p-4 space-y-4">
      {/* Color Palette */}
      {isDrawer && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground ml-2">الألوان:</span>
          <div className="flex gap-2 flex-wrap">
            {DRAWING_COLORS.map((color) => (
              <button
                key={color.value}
                data-testid={`color-${color.nameEn}`}
                onClick={() => setCurrentColor(color.value)}
                className={`w-10 h-10 rounded-full border-2 transition-all hover-elevate active-elevate-2 ${
                  currentColor === color.value
                    ? "border-primary ring-2 ring-primary ring-offset-2 scale-110"
                    : "border-border"
                }`}
                style={{ backgroundColor: color.value }}
                title={color.name}
                aria-label={color.name}
              />
            ))}
            <Button
              data-testid="button-custom-color"
              variant="outline"
              size="icon"
              onClick={() => setShowColorPicker(true)}
              className="w-10 h-10 rounded-full"
            >
              <Palette className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}

      {/* Undo/Redo Controls */}
      {isDrawer && (
        <div className="flex items-center gap-2">
          <Button
            data-testid="button-undo"
            variant="outline"
            size="sm"
            onClick={onUndo}
            disabled={!canUndo}
            className="min-w-20"
          >
            <Undo2 className="w-4 h-4 ml-1" />
            تراجع
          </Button>
          <Button
            data-testid="button-redo"
            variant="outline"
            size="sm"
            onClick={onRedo}
            disabled={!canRedo}
            className="min-w-20"
          >
            <Redo2 className="w-4 h-4 ml-1" />
            إعادة
          </Button>
        </div>
      )}

      {/* Tool Mode Selector */}
      {isDrawer && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground ml-2">الأداة:</span>
          <div className="flex gap-2">
            <Button
              data-testid="tool-draw"
              variant={toolMode === "draw" ? "default" : "outline"}
              size="sm"
              onClick={() => setToolMode("draw")}
              className="min-w-20"
            >
              <Pencil className="w-4 h-4 ml-1" />
              رسم
            </Button>
            <Button
              data-testid="tool-fill"
              variant={toolMode === "fill" ? "default" : "outline"}
              size="sm"
              onClick={() => setToolMode("fill")}
              className="min-w-20"
            >
              <PaintBucket className="w-4 h-4 ml-1" />
              تعبئة
            </Button>
          </div>
        </div>
      )}

      {/* Brush Size Selector */}
      {isDrawer && toolMode === "draw" && (
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-sm font-medium text-muted-foreground ml-2">حجم الفرشاة:</span>
          <div className="flex gap-2">
            {BRUSH_SIZES.map((size) => (
              <Button
                key={size.value}
                data-testid={`brush-${size.nameEn}`}
                variant={currentSize === size.value ? "default" : "outline"}
                size="sm"
                onClick={() => setCurrentSize(size.value)}
                className="min-w-20"
              >
                {size.name}
              </Button>
            ))}
          </div>
          {isDrawer && (
            <Button
              data-testid="button-clear-canvas"
              variant="destructive"
              size="sm"
              onClick={() => setShowClearDialog(true)}
              className="mr-auto"
            >
              <Trash2 className="w-4 h-4 ml-2" />
              مسح الكل
            </Button>
          )}
        </div>
      )}

      {/* Canvas */}
      <div className="relative bg-white rounded-lg border-2 border-border overflow-hidden aspect-[4/3]">
        <canvas
          ref={canvasRef}
          data-testid="drawing-canvas"
          width={800}
          height={600}
          className={`w-full h-full ${
            isDrawer 
              ? toolMode === "fill" 
                ? "cursor-pointer" 
                : toolMode === "eyedropper"
                ? "cursor-cell"
                : "cursor-crosshair" 
              : "cursor-default"
          }`}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
        />
        {!isDrawer && (
          <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
            <div className="bg-background/80 backdrop-blur-sm px-4 py-2 rounded-lg">
              <p className="text-sm text-muted-foreground">يرسم اللاعب الآخر...</p>
            </div>
          </div>
        )}
      </div>

      {/* Clear Canvas Confirmation Dialog */}
      <AlertDialog open={showClearDialog} onOpenChange={setShowClearDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>مسح اللوحة</AlertDialogTitle>
            <AlertDialogDescription>
              هل أنت متأكد أنك تريد مسح كل الرسومات؟ لا يمكن التراجع عن هذا الإجراء.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel data-testid="button-cancel-clear">إلغاء</AlertDialogCancel>
            <AlertDialogAction data-testid="button-confirm-clear" onClick={handleClear}>
              مسح
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Color Picker Dialog */}
      <ColorPickerDialog
        open={showColorPicker}
        onOpenChange={setShowColorPicker}
        currentColor={currentColor}
        onColorSelect={setCurrentColor}
        onEyedropperActivate={() => setToolMode("eyedropper")}
      />
    </Card>
  );
}
