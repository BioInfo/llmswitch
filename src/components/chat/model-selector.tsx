"use client"

import React from "react"
import { cn } from "@/lib/utils"
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { ModelType } from "@/hooks/use-chat"

const models = [
  {
    value: "claude" as ModelType,
    label: "Claude",
  },
  {
    value: "deepseek" as ModelType,
    label: "Deepseek R1",
  },
  {
    value: "claude_reasoning" as ModelType,
    label: "Claude + Reasoning",
  },
] as const

interface ModelSelectorProps {
  value: ModelType
  onChange: (value: ModelType) => void
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  // Memoize the current model lookup
  const currentModel = React.useMemo(() => 
    models.find(model => model.value === value), 
    [value]
  )

  // Memoize the change handler
  const handleValueChange = React.useCallback((newValue: string) => {
    console.log('ModelSelector value change:', newValue)
    // Validate that the new value is a valid ModelType
    if (models.some(model => model.value === newValue)) {
      onChange(newValue as ModelType)
    }
  }, [onChange])

  return (
    <Select
      value={value}
      onValueChange={handleValueChange}
    >
      <SelectTrigger 
        className={cn(
          "w-[180px]",
          "bg-background",
          "text-sm",
          "font-medium"
        )}
      >
        <SelectValue placeholder="Select model">
          {currentModel?.label || "Select model"}
        </SelectValue>
      </SelectTrigger>
      <SelectContent
        className={cn(
          "z-50", // Ensure dropdown is above other elements
          "min-w-[180px]"
        )}
      >
        <SelectGroup>
          {models.map((model) => (
            <SelectItem
              key={model.value}
              value={model.value}
              className={cn(
                "cursor-pointer",
                "relative",
                "flex",
                "w-full",
                "select-none",
                "items-center",
                "rounded-sm",
                "py-1.5",
                "pl-2",
                "pr-8",
                "text-sm",
                "outline-none",
                "focus:bg-accent",
                "focus:text-accent-foreground",
                "data-[disabled]:pointer-events-none",
                "data-[disabled]:opacity-50",
                model.value === value && "bg-accent/50"
              )}
            >
              {model.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
