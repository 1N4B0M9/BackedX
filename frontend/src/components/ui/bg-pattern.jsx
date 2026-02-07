import React from 'react';
import { cn } from '../../lib/utils';

// Mask: white = show pattern, black = hide. Use cover so gradient spans full element.
const MASK_STYLES = {
  'fade-edges': 'radial-gradient(ellipse at center, white, black 70%)',
  'fade-center': 'radial-gradient(circle at center, black 0%, black 38%, white 72%)',
  'fade-top': 'linear-gradient(to bottom, black, white)',
  'fade-bottom': 'linear-gradient(to bottom, white, black)',
  'fade-left': 'linear-gradient(to right, black, white)',
  'fade-right': 'linear-gradient(to right, white, black)',
  'fade-x': 'linear-gradient(to right, black, white, black)',
  'fade-y': 'linear-gradient(to bottom, black, white, black)',
  none: null,
};

function getBgImage(variant, fill, size) {
  switch (variant) {
    case 'dots':
      return `radial-gradient(${fill} 1.25px, transparent 1px)`;
    case 'grid':
      return `linear-gradient(to right, ${fill} 1px, transparent 1px), linear-gradient(to bottom, ${fill} 1px, transparent 1px)`;
    case 'diagonal-stripes':
      return `repeating-linear-gradient(45deg, ${fill}, ${fill} 1px, transparent 1px, transparent ${size}px)`;
    case 'horizontal-lines':
      return `linear-gradient(to bottom, ${fill} 1px, transparent 1px)`;
    case 'vertical-lines':
      return `linear-gradient(to right, ${fill} 1px, transparent 1px)`;
    case 'checkerboard':
      return `linear-gradient(45deg, ${fill} 25%, transparent 25%), linear-gradient(-45deg, ${fill} 25%, transparent 25%), linear-gradient(45deg, transparent 75%, ${fill} 75%), linear-gradient(-45deg, transparent 75%, ${fill} 75%)`;
    default:
      return undefined;
  }
}

export function BGPattern({
  variant = 'grid',
  mask = 'none',
  size = 24,
  fill = '#252525',
  className,
  style,
  ...props
}) {
  const bgSize = `${size}px ${size}px`;
  const backgroundImage = getBgImage(variant, fill, size);
  const maskStyle = MASK_STYLES[mask];

  return (
    <div
      className={cn('absolute inset-0 w-full h-full pointer-events-none', className)}
      style={{
        backgroundImage,
        backgroundSize: bgSize,
        ...(maskStyle && {
          maskImage: maskStyle,
          maskSize: '100% 100%',
          maskPosition: 'center',
          maskRepeat: 'no-repeat',
          WebkitMaskImage: maskStyle,
          WebkitMaskSize: '100% 100%',
          WebkitMaskPosition: 'center',
          WebkitMaskRepeat: 'no-repeat',
        }),
        ...style,
      }}
      {...props}
    />
  );
}
BGPattern.displayName = 'BGPattern';
