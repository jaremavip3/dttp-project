import * as React from "react";
import { Input as ShadcnInput } from "@/components/ui/input";
import { Button } from "./button";
import { cn } from "@/lib/utils";
import { Search, X } from "lucide-react";

const SearchInput = React.forwardRef(
  (
    {
      className,
      value,
      onChange,
      onSearch,
      onClear,
      placeholder = "Search products...",
      loading = false,
      showSearchButton = true,
      showClearButton = true,
      ...props
    },
    ref
  ) => {
    const handleKeyDown = (e) => {
      if (e.key === "Enter" && onSearch) {
        e.preventDefault();
        onSearch(value);
      }
    };

    const handleClear = () => {
      if (onChange) {
        onChange({ target: { value: "" } });
      }
      if (onClear) {
        onClear();
      }
    };

    return (
      <div className={cn("relative flex items-center", className)}>
        <div className="relative flex-1">
          <ShadcnInput
            ref={ref}
            type="text"
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            className={cn("pl-10", showClearButton && value && "pr-10", showSearchButton && "rounded-r-none")}
            {...props}
          />

          {/* Search icon */}
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />

          {/* Clear button */}
          {showClearButton && value && (
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="absolute right-2 top-1/2 h-6 w-6 -translate-y-1/2 p-0 hover:bg-transparent"
              onClick={handleClear}
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>

        {/* Search button */}
        {showSearchButton && (
          <Button
            type="button"
            variant="default"
            className="rounded-l-none"
            onClick={() => onSearch && onSearch(value)}
            loading={loading}
            disabled={!value?.trim()}
          >
            Search
          </Button>
        )}
      </div>
    );
  }
);
SearchInput.displayName = "SearchInput";

export { SearchInput, ShadcnInput as Input };
