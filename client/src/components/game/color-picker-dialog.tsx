import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Pipette } from "lucide-react";

interface ColorPickerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  currentColor: string;
  onColorSelect: (color: string) => void;
  onEyedropperActivate: () => void;
}

export function ColorPickerDialog({
  open,
  onOpenChange,
  currentColor,
  onColorSelect,
  onEyedropperActivate,
}: ColorPickerDialogProps) {
  const [hexInput, setHexInput] = useState(currentColor);
  const [r, setR] = useState(0);
  const [g, setG] = useState(0);
  const [b, setB] = useState(0);

  useEffect(() => {
    // Update RGB when hex changes
    const rgb = hexToRgb(currentColor);
    if (rgb) {
      setR(rgb.r);
      setG(rgb.g);
      setB(rgb.b);
    }
    setHexInput(currentColor);
  }, [currentColor]);

  const hexToRgb = (hex: string) => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result
      ? {
          r: parseInt(result[1], 16),
          g: parseInt(result[2], 16),
          b: parseInt(result[3], 16),
        }
      : null;
  };

  const rgbToHex = (r: number, g: number, b: number) => {
    return "#" + [r, g, b].map((x) => {
      const hex = x.toString(16);
      return hex.length === 1 ? "0" + hex : hex;
    }).join("");
  };

  const handleHexChange = (value: string) => {
    let cleanValue = value.replace(/[^#0-9a-fA-F]/g, "");
    if (!cleanValue.startsWith("#")) {
      cleanValue = "#" + cleanValue;
    }
    setHexInput(cleanValue);

    if (/^#[0-9a-fA-F]{6}$/.test(cleanValue)) {
      const rgb = hexToRgb(cleanValue);
      if (rgb) {
        setR(rgb.r);
        setG(rgb.g);
        setB(rgb.b);
        onColorSelect(cleanValue);
      }
    }
  };

  const handleRgbChange = (channel: "r" | "g" | "b", value: string) => {
    const numValue = Math.max(0, Math.min(255, parseInt(value) || 0));
    
    let newR = r;
    let newG = g;
    let newB = b;

    if (channel === "r") {
      newR = numValue;
      setR(numValue);
    } else if (channel === "g") {
      newG = numValue;
      setG(numValue);
    } else {
      newB = numValue;
      setB(numValue);
    }

    const hex = rgbToHex(newR, newG, newB);
    setHexInput(hex);
    onColorSelect(hex);
  };

  const presetColors = [
    "#FF0000", "#FF6B00", "#FFD700", "#00FF00",
    "#00BFFF", "#0000FF", "#8B00FF", "#FF1493",
    "#FFFFFF", "#C0C0C0", "#808080", "#000000",
    "#8B4513", "#2F4F4F", "#FF69B4", "#00CED1",
  ];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md" dir="rtl">
        <DialogHeader>
          <DialogTitle>اختيار اللون</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          {/* Color Preview */}
          <div className="flex items-center gap-4">
            <div
              className="w-20 h-20 rounded-lg border-2 border-border"
              style={{ backgroundColor: currentColor }}
            />
            <div className="flex-1 space-y-2">
              <Label htmlFor="hex-input">رمز اللون (HEX)</Label>
              <Input
                id="hex-input"
                data-testid="input-hex-color"
                value={hexInput}
                onChange={(e) => handleHexChange(e.target.value)}
                placeholder="#000000"
                maxLength={7}
              />
            </div>
          </div>

          {/* RGB Inputs */}
          <div className="grid grid-cols-3 gap-3">
            <div className="space-y-2">
              <Label htmlFor="r-input">أحمر (R)</Label>
              <Input
                id="r-input"
                data-testid="input-rgb-r"
                type="number"
                min="0"
                max="255"
                value={r}
                onChange={(e) => handleRgbChange("r", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="g-input">أخضر (G)</Label>
              <Input
                id="g-input"
                data-testid="input-rgb-g"
                type="number"
                min="0"
                max="255"
                value={g}
                onChange={(e) => handleRgbChange("g", e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="b-input">أزرق (B)</Label>
              <Input
                id="b-input"
                data-testid="input-rgb-b"
                type="number"
                min="0"
                max="255"
                value={b}
                onChange={(e) => handleRgbChange("b", e.target.value)}
              />
            </div>
          </div>

          {/* Preset Color Palette */}
          <div className="space-y-2">
            <Label>ألوان جاهزة</Label>
            <div className="grid grid-cols-8 gap-2">
              {presetColors.map((color) => (
                <button
                  key={color}
                  data-testid={`preset-color-${color}`}
                  className="w-8 h-8 rounded-md border-2 border-border hover-elevate active-elevate-2 transition-transform"
                  style={{ backgroundColor: color }}
                  onClick={() => {
                    onColorSelect(color);
                    onOpenChange(false);
                  }}
                  aria-label={`اختيار اللون ${color}`}
                />
              ))}
            </div>
          </div>

          {/* Eyedropper Tool */}
          <Button
            data-testid="button-eyedropper"
            variant="outline"
            className="w-full"
            onClick={() => {
              onEyedropperActivate();
              onOpenChange(false);
            }}
          >
            <Pipette className="w-4 h-4 ml-2" />
            اختيار لون من اللوحة
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
