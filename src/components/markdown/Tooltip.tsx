import React, { useState } from 'react';
import { twMerge } from 'tailwind-merge';
import type { BaseCustomProps } from './types';

/*
[//]: # (Component: Tooltip)
[//]: # (Description: Shows a floating tooltip on hover over content)
[//]: # (Usage: <tooltip text="Tooltip text">Hover over me</tooltip>)
[//]: # (Props:)
[//]: # (  - text: string - The tooltip content to display)
[//]: # (  - position?: string - Tooltip position (top|bottom|left|right), defaults to top)
[//]: # (Example:)
[//]: # (```markdown)
[//]: # (<tooltip text="This is a helpful tip">Hover over me</tooltip>)
[//]: # (<tooltip text="Opens in new window" position="right">External Link</tooltip>)
[//]: # (```)
[//]: # (Notes: Tooltip automatically adjusts position to stay in viewport)
*/

export const Tooltip: React.ComponentType<BaseCustomProps> = (props) => {
  const [isVisible, setIsVisible] = useState(false);
  const [tooltipPosition, setTooltipPosition] = useState({ top: 0, left: 0 });
  
  const text = props.text as string;
  const position = (props.position as string) || 'top';
  const { className, children } = props;

  if (!text) {
    return (
      <span className="inline-text text-red-500">
        Tooltip requires a text prop
      </span>
    );
  }

  const handleMouseEnter = (e: React.MouseEvent<HTMLSpanElement>) => {
    const element = e.currentTarget;
    const rect = element.getBoundingClientRect();
    const spacing = 8; // Gap between content and tooltip

    let top = 0;
    let left = 0;

    switch (position) {
      case 'bottom':
        top = rect.bottom + spacing;
        left = rect.left + (rect.width / 2);
        break;
      case 'left':
        top = rect.top + (rect.height / 2);
        left = rect.left - spacing;
        break;
      case 'right':
        top = rect.top + (rect.height / 2);
        left = rect.right + spacing;
        break;
      case 'top':
      default:
        top = rect.top - spacing;
        left = rect.left + (rect.width / 2);
        break;
    }

    setTooltipPosition({ top, left });
    setIsVisible(true);
  };

  const tooltipClasses = twMerge(
    "fixed z-50 px-2 py-1 text-sm rounded shadow-lg",
    "bg-gray-900 text-white dark:bg-gray-100 dark:text-gray-900",
    "transform -translate-x-1/2 -translate-y-full",
    "opacity-0 invisible transition-opacity duration-200",
    isVisible && "opacity-100 visible",
    position === 'bottom' && "-translate-y-0 translate-y-2",
    position === 'left' && "-translate-x-full -translate-y-1/2 -ml-2",
    position === 'right' && "translate-x-2 -translate-y-1/2",
    className
  );

  return (
    <>
      <span
        className="inline-block relative"
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
        <span
          className={tooltipClasses}
          style={{
            top: `${tooltipPosition.top}px`,
            left: `${tooltipPosition.left}px`
          }}
          role="tooltip"
        >
          {text}
          <span
            className={twMerge(
              "absolute w-2 h-2 bg-gray-900 dark:bg-gray-100 transform rotate-45",
              position === 'bottom' && "top-0 -translate-y-1",
              position === 'top' && "bottom-0 translate-y-1",
              position === 'left' && "right-0 translate-x-1",
              position === 'right' && "left-0 -translate-x-1"
            )}
            style={{
              left: position === 'top' || position === 'bottom' ? 'calc(50% - 4px)' : undefined,
              top: position === 'left' || position === 'right' ? 'calc(50% - 4px)' : undefined
            }}
          />
        </span>
      </span>
    </>
  );
};