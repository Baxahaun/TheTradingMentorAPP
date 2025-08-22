import * as React from "react";
import { Hash, MoreHorizontal } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

const tagDisplayVariants = cva(
  "flex flex-wrap items-center",
  {
    variants: {
      variant: {
        default: "gap-2",
        compact: "gap-1",
        minimal: "gap-1",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

const tagBadgeVariants = cva(
  "inline-flex items-center gap-1 transition-colors",
  {
    variants: {
      variant: {
        default: "px-2 py-1 text-xs",
        compact: "px-1.5 py-0.5 text-xs",
        minimal: "px-1 py-0.5 text-xs",
      },
      interactive: {
        true: "cursor-pointer hover:bg-secondary/80 focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1",
        false: "",
      },
    },
    defaultVariants: {
      variant: "default",
      interactive: false,
    },
  }
);

export interface TagDisplayProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof tagDisplayVariants> {
  tags: string[];
  interactive?: boolean;
  onTagClick?: (tag: string) => void;
  maxDisplay?: number;
  showOverflow?: boolean;
  emptyMessage?: string;
  showHashIcon?: boolean;
  highlightedTags?: string[];
}

const TagDisplay = React.forwardRef<HTMLDivElement, TagDisplayProps>(
  (
    {
      tags = [],
      variant = "default",
      interactive = false,
      onTagClick,
      maxDisplay,
      showOverflow = true,
      emptyMessage,
      showHashIcon = true,
      highlightedTags = [],
      className,
      ...props
    },
    ref
  ) => {
    // Filter out empty or invalid tags
    const validTags = React.useMemo(() => {
      if (!tags || !Array.isArray(tags)) return [];
      return tags.filter(tag => tag && typeof tag === 'string' && tag.trim().length > 0);
    }, [tags]);

    // Handle empty state
    if (validTags.length === 0) {
      if (emptyMessage) {
        return (
          <div
            ref={ref}
            className={cn("text-sm text-muted-foreground", className)}
            {...props}
          >
            {emptyMessage}
          </div>
        );
      }
      return null;
    }

    // Determine which tags to display and which are overflow
    const displayTags = maxDisplay !== undefined && maxDisplay >= 0 
      ? validTags.slice(0, maxDisplay)
      : validTags;
    
    const overflowTags = maxDisplay !== undefined && maxDisplay >= 0 && validTags.length > maxDisplay
      ? validTags.slice(maxDisplay)
      : [];

    const hasOverflow = overflowTags.length > 0;

    // Handle tag click
    const handleTagClick = React.useCallback((tag: string) => {
      if (interactive && onTagClick) {
        onTagClick(tag);
      }
    }, [interactive, onTagClick]);

    // Handle keyboard navigation for interactive tags
    const handleTagKeyDown = React.useCallback((
      event: React.KeyboardEvent<HTMLDivElement>,
      tag: string
    ) => {
      if (interactive && onTagClick && (event.key === 'Enter' || event.key === ' ')) {
        event.preventDefault();
        onTagClick(tag);
      }
    }, [interactive, onTagClick]);

    // Format tag display text (remove # if present)
    const formatTagText = React.useCallback((tag: string) => {
      return tag.startsWith('#') ? tag.slice(1) : tag;
    }, []);

    // Check if a tag should be highlighted
    const isTagHighlighted = React.useCallback((tag: string) => {
      if (!highlightedTags || highlightedTags.length === 0) return false;
      const normalizedTag = tag.startsWith('#') ? tag : `#${tag}`;
      return highlightedTags.some(highlightTag => {
        const normalizedHighlight = highlightTag.startsWith('#') ? highlightTag : `#${highlightTag}`;
        return normalizedTag.toLowerCase() === normalizedHighlight.toLowerCase();
      });
    }, [highlightedTags]);

    return (
      <div
        ref={ref}
        className={cn(tagDisplayVariants({ variant }), className)}
        {...props}
      >
        {displayTags.map((tag, index) => {
          const highlighted = isTagHighlighted(tag);
          return (
            <Badge
              key={`${tag}-${index}`}
              variant={highlighted ? "default" : "secondary"}
              className={cn(
                tagBadgeVariants({ 
                  variant, 
                  interactive: interactive && !!onTagClick 
                }),
                highlighted && "bg-yellow-100 text-yellow-800 border-yellow-300 hover:bg-yellow-200"
              )}
              onClick={() => handleTagClick(tag)}
              onKeyDown={(e) => handleTagKeyDown(e, tag)}
              tabIndex={interactive && onTagClick ? 0 : -1}
              role={interactive && onTagClick ? "button" : undefined}
              aria-label={interactive && onTagClick ? `Filter by ${tag} tag` : undefined}
            >
              {showHashIcon && variant !== "minimal" && (
                <Hash className={cn(
                  "shrink-0",
                  variant === "compact" ? "h-2.5 w-2.5" : "h-3 w-3"
                )} />
              )}
              <span className="truncate">
                {formatTagText(tag)}
              </span>
            </Badge>
          );
        })}

        {/* Overflow indicator */}
        {hasOverflow && showOverflow && (
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="sm"
                  className={cn(
                    "h-auto p-1 text-muted-foreground hover:text-foreground",
                    variant === "compact" && "p-0.5",
                    variant === "minimal" && "p-0.5"
                  )}
                  onClick={() => {
                    // If interactive, could trigger a callback to show all tags
                    if (interactive && onTagClick) {
                      // For now, just show the first overflow tag
                      // In a real implementation, this might open a popover or modal
                      onTagClick(overflowTags[0]);
                    }
                  }}
                >
                  <MoreHorizontal className={cn(
                    variant === "compact" || variant === "minimal" 
                      ? "h-3 w-3" 
                      : "h-4 w-4"
                  )} />
                  <span className="ml-1 text-xs">
                    +{overflowTags.length}
                  </span>
                </Button>
              </TooltipTrigger>
              <TooltipContent side="top" className="max-w-xs">
                <div className="space-y-1">
                  <p className="font-medium">Additional tags:</p>
                  <div className="flex flex-wrap gap-1">
                    {overflowTags.map((tag, index) => (
                      <span
                        key={`overflow-${tag}-${index}`}
                        className="inline-flex items-center gap-1 rounded bg-secondary px-1.5 py-0.5 text-xs"
                      >
                        {showHashIcon && <Hash className="h-2.5 w-2.5" />}
                        {formatTagText(tag)}
                      </span>
                    ))}
                  </div>
                </div>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        )}
      </div>
    );
  }
);

TagDisplay.displayName = "TagDisplay";

export { TagDisplay, tagDisplayVariants, tagBadgeVariants };