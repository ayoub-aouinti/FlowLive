import React, { useCallback, useEffect, useRef, useState } from 'react';

interface TopScrollbarProps {
  targetRef: React.RefObject<HTMLElement | null>;
}

const TopScrollbar: React.FC<TopScrollbarProps> = ({ targetRef }) => {
  const trackRef = useRef<HTMLDivElement>(null);
  const dragState = useRef<{ startX: number; startScrollLeft: number } | null>(null);
  const [visible, setVisible] = useState(false);
  const [thumb, setThumb] = useState({ widthPct: 100, leftPct: 0 });

  const recompute = useCallback(() => {
    const target = targetRef.current;
    if (!target) return;
    const { scrollWidth, clientWidth, scrollLeft } = target;
    const overflow = scrollWidth > clientWidth + 1;
    setVisible(overflow);
    if (!overflow) return;
    const widthPct = Math.max((clientWidth / scrollWidth) * 100, 6);
    const maxScroll = scrollWidth - clientWidth;
    const leftPct = maxScroll > 0 ? (scrollLeft / maxScroll) * (100 - widthPct) : 0;
    setThumb({ widthPct, leftPct });
  }, [targetRef]);

  useEffect(() => {
    const target = targetRef.current;
    if (!target) return;
    recompute();

    const ro = new ResizeObserver(recompute);
    ro.observe(target);
    const mo = new MutationObserver(recompute);
    mo.observe(target, { childList: true, subtree: true });
    target.addEventListener('scroll', recompute);

    return () => {
      ro.disconnect();
      mo.disconnect();
      target.removeEventListener('scroll', recompute);
    };
  }, [targetRef, recompute]);

  const onThumbPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = targetRef.current;
    if (!target) return;
    e.preventDefault();
    e.stopPropagation();
    e.currentTarget.setPointerCapture(e.pointerId);
    dragState.current = { startX: e.clientX, startScrollLeft: target.scrollLeft };
  };

  const onThumbPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const target = targetRef.current;
    const track = trackRef.current;
    if (!target || !track || !dragState.current) return;
    const trackWidth = track.clientWidth;
    const maxScroll = target.scrollWidth - target.clientWidth;
    const deltaX = e.clientX - dragState.current.startX;
    const deltaScroll = trackWidth > 0 ? (deltaX / trackWidth) * target.scrollWidth : 0;
    target.scrollLeft = Math.min(Math.max(dragState.current.startScrollLeft + deltaScroll, 0), maxScroll);
  };

  const onThumbPointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    dragState.current = null;
    if (e.currentTarget.hasPointerCapture(e.pointerId)) {
      e.currentTarget.releasePointerCapture(e.pointerId);
    }
  };

  const onTrackClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const target = targetRef.current;
    const track = trackRef.current;
    if (!target || !track || e.target !== track) return;
    const rect = track.getBoundingClientRect();
    const clickRatio = (e.clientX - rect.left) / rect.width;
    const maxScroll = target.scrollWidth - target.clientWidth;
    target.scrollLeft = clickRatio * maxScroll;
  };

  if (!visible) return null;

  return (
    <div
      ref={trackRef}
      onClick={onTrackClick}
      className="relative h-2.5 rounded-full bg-[var(--surface-low)] mb-2 cursor-pointer select-none"
    >
      <div
        onPointerDown={onThumbPointerDown}
        onPointerMove={onThumbPointerMove}
        onPointerUp={onThumbPointerUp}
        onPointerCancel={onThumbPointerUp}
        className="absolute top-0 h-full rounded-full bg-[var(--notion-border)] hover:bg-[var(--notion-text-light)] active:bg-[var(--brand-secondary)] transition-colors cursor-grab active:cursor-grabbing touch-none"
        style={{ width: `${thumb.widthPct}%`, left: `${thumb.leftPct}%` }}
      />
    </div>
  );
};

export default TopScrollbar;
