import React, { useRef, useEffect, useState, useCallback } from 'react';

export interface TechTextProps {
  text?: string;
  fontWeight?: number | string;
  fontSize?: number;
  reveal?: 'letter' | 'fade' | 'none';
  dashLength?: number;
  dashGap?: number;
  specks?: number;
  fontFamily?: string;
  color?: string;
  accentColor?: string;
  letterSpacing?: number;
  reach?: number;
  softness?: number;
  strokeWidth?: number;
  speed?: number;
  lineStyle?: 'dashed' | 'solid' | 'dotted';
  selection?: boolean;
  labels?: boolean;
  draggable?: boolean;
  sweep?: boolean;
  className?: string;
  style?: React.CSSProperties;
}

interface LetterNode {
  char: string;
  x: number;
  y: number;
  width: number;
  height: number;
  baseline: number;
  offsetX: number;
  offsetY: number;
  vx: number;
  vy: number;
  isDragging: boolean;
  hoverRatio: number;
  index: number;
}

interface Speck {
  x: number;
  y: number;
  size: number;
  alpha: number;
  life: number;
  maxLife: number;
  vx: number;
  vy: number;
  letterIndex: number;
}

export const TechText: React.FC<TechTextProps> = ({
  text = 'React Bits',
  fontWeight = 600,
  fontSize = 120,
  reveal = 'letter',
  dashLength = 4,
  dashGap = 2,
  specks: speckCount = 15,
  fontFamily = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
  color = '#ffffff',
  accentColor = '#ffffff',
  letterSpacing = -0.05,
  reach = 200,
  softness = 0.7,
  strokeWidth = 1.5,
  speed = 1,
  lineStyle = 'dashed',
  selection = true,
  labels = false,
  draggable = true,
  sweep = true,
  className = '',
  style = {},
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  const lettersRef = useRef<LetterNode[]>([]);
  const specksRef = useRef<Speck[]>([]);
  const mouseRef = useRef<{
    x: number;
    y: number;
    isDown: boolean;
    draggedIndex: number | null;
    startX: number;
    startY: number;
  }>({
    x: -1000,
    y: -1000,
    isDown: false,
    draggedIndex: null,
    startX: 0,
    startY: 0,
  });

  const sweepProgressRef = useRef<number>(0);
  const animFrameRef = useRef<number>(0);
  const [activeLetterHover, setActiveLetterHover] = useState<number | null>(null);

  // Initialize letters layout
  const computeLayout = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    const width = rect.width || 800;
    const height = rect.height || 480;

    const fontStr = `${fontWeight} ${fontSize}px ${fontFamily || 'Inter, sans-serif'}`;
    ctx.font = fontStr;
    ctx.textBaseline = 'middle';

    const charList = text.split('');
    const charMetrics = charList.map((ch) => {
      const m = ctx.measureText(ch);
      return {
        char: ch,
        width: m.width + fontSize * letterSpacing,
        actualWidth: m.width,
        ascent: m.actualBoundingBoxAscent || fontSize * 0.4,
        descent: m.actualBoundingBoxDescent || fontSize * 0.1,
      };
    });

    const totalTextWidth = charMetrics.reduce((acc, c) => acc + c.width, 0);
    let startX = (width - totalTextWidth) / 2;
    const centerY = height / 2;

    const existingLetters = lettersRef.current;
    const newLetters: LetterNode[] = charMetrics.map((m, i) => {
      const prev = existingLetters[i];
      const charX = startX;
      startX += m.width;

      return {
        char: m.char,
        x: charX,
        y: centerY,
        width: m.actualWidth,
        height: m.ascent + m.descent + 10,
        baseline: centerY,
        offsetX: prev ? prev.offsetX : 0,
        offsetY: prev ? prev.offsetY : 0,
        vx: prev ? prev.vx : 0,
        vy: prev ? prev.vy : 0,
        isDragging: prev ? prev.isDragging : false,
        hoverRatio: prev ? prev.hoverRatio : 0,
        index: i,
      };
    });

    lettersRef.current = newLetters;

    // Initialize specks if needed
    if (specksRef.current.length === 0 && speckCount > 0) {
      const initialSpecks: Speck[] = [];
      for (let i = 0; i < speckCount * charList.length; i++) {
        const randLetter = Math.floor(Math.random() * charList.length);
        const lNode = newLetters[randLetter];
        if (lNode) {
          initialSpecks.push({
            x: lNode.x + Math.random() * (lNode.width || 20),
            y: lNode.y + (Math.random() - 0.5) * fontSize,
            size: Math.random() * 2 + 1,
            alpha: Math.random(),
            life: Math.random() * 60,
            maxLife: 40 + Math.random() * 40,
            vx: (Math.random() - 0.5) * 0.8,
            vy: -Math.random() * 1.2 - 0.2,
            letterIndex: randLetter,
          });
        }
      }
      specksRef.current = initialSpecks;
    }
  }, [text, fontWeight, fontSize, fontFamily, letterSpacing, speckCount]);

  // Canvas resize and render setup
  useEffect(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const updateSize = () => {
      const rect = container.getBoundingClientRect();
      const dpr = window.devicePixelRatio || 1;
      canvas.width = rect.width * dpr;
      canvas.height = rect.height * dpr;
      canvas.style.width = `${rect.width}px`;
      canvas.style.height = `${rect.height}px`;

      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.scale(dpr, dpr);
      }
      computeLayout();
    };

    updateSize();

    const resizeObserver = new ResizeObserver(() => {
      updateSize();
    });
    resizeObserver.observe(container);

    return () => {
      resizeObserver.disconnect();
    };
  }, [computeLayout]);

  // Main Animation Loop
  useEffect(() => {
    let active = true;

    const render = () => {
      if (!active) return;
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const rect = canvas.getBoundingClientRect();
      const width = rect.width;
      const height = rect.height;

      ctx.clearRect(0, 0, width, height);

      const mouse = mouseRef.current;
      const letters = lettersRef.current;

      // Update Sweep
      if (sweep) {
        sweepProgressRef.current = (sweepProgressRef.current + 0.008 * speed) % 1.4;
      }

      const fontStr = `${fontWeight} ${fontSize}px ${fontFamily || 'Inter, sans-serif'}`;
      ctx.font = fontStr;
      ctx.textBaseline = 'middle';

      let currentHovered: number | null = null;

      // Update and draw each letter
      letters.forEach((l, idx) => {
        // Physics for dragging / spring back
        if (draggable) {
          if (l.isDragging && mouse.isDown) {
            // Letter follows mouse directly
            const targetX = mouse.x - mouse.startX;
            const targetY = mouse.y - mouse.startY;
            l.offsetX = targetX;
            l.offsetY = targetY;
            l.vx = 0;
            l.vy = 0;
          } else {
            // Spring return to 0 offset
            const springK = 0.18;
            const damping = 0.78;

            const ax = -l.offsetX * springK;
            const ay = -l.offsetY * springK;

            l.vx = (l.vx + ax) * damping;
            l.vy = (l.vy + ay) * damping;

            l.offsetX += l.vx;
            l.offsetY += l.vy;

            if (Math.abs(l.offsetX) < 0.01 && Math.abs(l.vx) < 0.01) l.offsetX = 0;
            if (Math.abs(l.offsetY) < 0.01 && Math.abs(l.vy) < 0.01) l.offsetY = 0;
          }
        }

        const posX = l.x + l.offsetX;
        const posY = l.y + l.offsetY;

        // Calculate distance to mouse pointer
        const centerX = posX + l.width / 2;
        const centerY = posY;
        const dist = Math.hypot(mouse.x - centerX, mouse.y - centerY);

        // Hover ratio calculation (0 = far away/solid, 1 = direct hover/tech outline)
        let targetHover = 0;
        if (dist < reach) {
          const raw = 1 - dist / reach;
          targetHover = Math.pow(raw, 1 / Math.max(0.1, softness));
          currentHovered = idx;
        }

        // Add sweep effect
        if (sweep) {
          const letterNormX = (l.x + l.width / 2) / width;
          const sweepDist = Math.abs(letterNormX - (sweepProgressRef.current - 0.2));
          if (sweepDist < 0.12) {
            const sweepIntensity = (1 - sweepDist / 0.12) * 0.85;
            targetHover = Math.max(targetHover, sweepIntensity);
          }
        }

        // Smooth transition
        l.hoverRatio += (targetHover - l.hoverRatio) * 0.25;
        const hRatio = Math.min(1, Math.max(0, l.hoverRatio));

        ctx.save();
        ctx.translate(posX, posY);

        // 1. Draw solid base text with opacity (1 - hRatio)
        if (hRatio < 0.98) {
          ctx.fillStyle = color;
          ctx.globalAlpha = 1 - hRatio;
          ctx.fillText(l.char, 0, 0);
        }

        // 2. Draw tech dashed outline on hover
        if (hRatio > 0.02) {
          ctx.strokeStyle = accentColor || color;
          ctx.lineWidth = strokeWidth;
          ctx.globalAlpha = hRatio;

          if (lineStyle === 'dashed') {
            ctx.setLineDash([dashLength, dashGap]);
          } else if (lineStyle === 'dotted') {
            ctx.setLineDash([strokeWidth, dashGap * 1.5]);
          } else {
            ctx.setLineDash([]);
          }

          ctx.strokeText(l.char, 0, 0);

          // Additional inner glow or technical coordinate markers
          if (labels && hRatio > 0.4) {
            ctx.save();
            ctx.setLineDash([]);
            ctx.strokeStyle = accentColor;
            ctx.globalAlpha = (hRatio - 0.4) * 0.6;
            ctx.lineWidth = 0.75;

            // Tech Corner Bounding Box
            const pad = 6;
            const x0 = -pad;
            const y0 = -l.height / 2 - pad;
            const x1 = l.width + pad;
            const y1 = l.height / 2 + pad;
            const cornerSize = 4;

            // Corners
            ctx.beginPath();
            ctx.moveTo(x0, y0 + cornerSize);
            ctx.lineTo(x0, y0);
            ctx.lineTo(x0 + cornerSize, y0);

            ctx.moveTo(x1 - cornerSize, y0);
            ctx.lineTo(x1, y0);
            ctx.lineTo(x1, y0 + cornerSize);

            ctx.moveTo(x0, y1 - cornerSize);
            ctx.lineTo(x0, y1);
            ctx.lineTo(x0 + cornerSize, y1);

            ctx.moveTo(x1 - cornerSize, y1);
            ctx.lineTo(x1, y1);
            ctx.lineTo(x1, y1 - cornerSize);
            ctx.stroke();

            // Coordinate label
            ctx.font = `9px monospace`;
            ctx.fillStyle = accentColor;
            ctx.globalAlpha = (hRatio - 0.4) * 0.8;
            ctx.fillText(`L:${idx} [${Math.round(posX)},${Math.round(posY)}]`, x0, y0 - 3);
            ctx.restore();
          }
        }

        ctx.restore();
      });

      // Update and Draw Specks/Particles
      if (speckCount > 0) {
        ctx.save();
        specksRef.current.forEach((s) => {
          const parentLetter = letters[s.letterIndex];
          if (!parentLetter) return;

          s.x += s.vx * speed;
          s.y += s.vy * speed;
          s.life += 1;

          // Respawn speck if life ends or out of range
          if (s.life >= s.maxLife) {
            s.life = 0;
            s.x = parentLetter.x + parentLetter.offsetX + Math.random() * (parentLetter.width || 20);
            s.y = parentLetter.y + parentLetter.offsetY + (Math.random() - 0.5) * fontSize * 0.8;
            s.alpha = Math.random() * 0.8 + 0.2;
          }

          const activeBonus = parentLetter.hoverRatio > 0.2 ? 1.5 : 0.3;
          const currentAlpha = Math.sin((s.life / s.maxLife) * Math.PI) * s.alpha * activeBonus;

          if (currentAlpha > 0.05) {
            ctx.fillStyle = accentColor || color;
            ctx.globalAlpha = Math.min(1, currentAlpha);
            ctx.fillRect(s.x, s.y, s.size, s.size);
          }
        });
        ctx.restore();
      }

      setActiveLetterHover(currentHovered);
      animFrameRef.current = requestAnimationFrame(render);
    };

    animFrameRef.current = requestAnimationFrame(render);

    return () => {
      active = false;
      cancelAnimationFrame(animFrameRef.current);
    };
  }, [
    text,
    fontWeight,
    fontSize,
    fontFamily,
    color,
    accentColor,
    reach,
    softness,
    strokeWidth,
    speed,
    lineStyle,
    dashLength,
    dashGap,
    labels,
    draggable,
    sweep,
    speckCount,
  ]);

  // Pointer Event Handlers
  const handlePointerMove = (e: React.PointerEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseRef.current.x = x;
    mouseRef.current.y = y;
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLCanvasElement>) => {
    if (!draggable && !selection) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    mouseRef.current.x = x;
    mouseRef.current.y = y;
    mouseRef.current.isDown = true;

    // Find clicked letter
    const letters = lettersRef.current;
    for (let i = letters.length - 1; i >= 0; i--) {
      const l = letters[i];
      const lx = l.x + l.offsetX;
      const ly = l.y + l.offsetY;
      if (
        x >= lx - 10 &&
        x <= lx + l.width + 10 &&
        y >= ly - l.height / 2 - 10 &&
        y <= ly + l.height / 2 + 10
      ) {
        l.isDragging = true;
        mouseRef.current.draggedIndex = i;
        mouseRef.current.startX = x - l.offsetX;
        mouseRef.current.startY = y - l.offsetY;
        canvas.setPointerCapture(e.pointerId);
        break;
      }
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLCanvasElement>) => {
    mouseRef.current.isDown = false;
    lettersRef.current.forEach((l) => {
      l.isDragging = false;
    });
    mouseRef.current.draggedIndex = null;
    try {
      canvasRef.current?.releasePointerCapture(e.pointerId);
    } catch {
      // Ignore if not captured
    }
  };

  const handlePointerLeave = () => {
    mouseRef.current.x = -1000;
    mouseRef.current.y = -1000;
    mouseRef.current.isDown = false;
    lettersRef.current.forEach((l) => {
      l.isDragging = false;
    });
  };

  return (
    <div
      ref={containerRef}
      className={`relative w-full h-full flex items-center justify-center select-none overflow-hidden ${className}`}
      style={{
        minHeight: '280px',
        cursor: activeLetterHover !== null && draggable ? 'grab' : 'default',
        ...style,
      }}
    >
      <canvas
        ref={canvasRef}
        onPointerMove={handlePointerMove}
        onPointerDown={handlePointerDown}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerLeave}
        className="w-full h-full block touch-none"
      />
    </div>
  );
};

export default TechText;
