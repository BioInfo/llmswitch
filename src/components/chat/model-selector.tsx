"use client"

import React from "react"
import { Check, ChevronsUpDown } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
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
]

interface ModelSelectorProps {
  value: ModelType
  onChange: (value: ModelType) => void
}

export function ModelSelector({ value, onChange }: ModelSelectorProps) {
  const handleValueChange = React.useCallback((newValue: string) => {
    console.log('Select onValueChange:', newValue)
    onChange(newValue as ModelType)
  }, [onChange])

  return (
    <Select value={value} onValueChange={handleValueChange}>
      <SelectTrigger className="w-[150px] bg-background">
        <SelectValue placeholder="Select model" />
      </SelectTrigger>
      <SelectContent>
        <SelectGroup>
          {models.map((model) => (
            <SelectItem
              key={model.value}
              value={model.value}
              className="cursor-pointer hover:bg-accent hover:text-accent-foreground"
            >
              {model.label}
            </SelectItem>
          ))}
        </SelectGroup>
      </SelectContent>
    </Select>
  )
}
