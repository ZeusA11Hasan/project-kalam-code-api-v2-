"use client"

import { FC } from "react"
import { Label } from "./label"
import { Slider } from "./slider"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue
} from "./select"
import { Switch } from "./switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "./tabs"
import { Input } from "./input"
import { TextareaAutosize } from "./textarea-autosize"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger
} from "./accordion"

interface ChatSettingsFormProps {
  chatSettings?: any
  onChangeChatSettings?: (settings: any) => void
  showSystemPrompt?: boolean
  showModelSelect?: boolean
}

export const ChatSettingsForm: FC<ChatSettingsFormProps> = ({
  chatSettings = {},
  onChangeChatSettings,
  showSystemPrompt = true,
  showModelSelect = true
}) => {
  const updateSettings = (key: string, value: any) => {
    if (onChangeChatSettings) {
      onChangeChatSettings({ ...chatSettings, [key]: value })
    }
  }

  return (
    <div className="space-y-6">
      {showSystemPrompt && (
        <div className="space-y-2">
          <Label>System Prompt</Label>
          <TextareaAutosize
            value={chatSettings.prompt || ""}
            onChange={e => updateSettings("prompt", e.target.value)}
            placeholder="Enter system prompt..."
            minRows={3}
            maxRows={10}
          />
        </div>
      )}

      <Accordion type="single" collapsible>
        <AccordionItem value="advanced">
          <AccordionTrigger>Advanced Settings</AccordionTrigger>
          <AccordionContent>
            <div className="space-y-4 pt-4">
              <div className="space-y-2">
                <Label>Temperature: {chatSettings.temperature || 0.7}</Label>
                <Slider
                  value={[chatSettings.temperature || 0.7]}
                  onValueChange={([value]) =>
                    updateSettings("temperature", value)
                  }
                  min={0}
                  max={2}
                  step={0.1}
                />
              </div>

              <div className="space-y-2">
                <Label>Max Tokens</Label>
                <Input
                  type="number"
                  value={chatSettings.maxTokens || 4096}
                  onChange={e =>
                    updateSettings("maxTokens", parseInt(e.target.value))
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Include Profile Context</Label>
                <Switch
                  checked={chatSettings.includeProfileContext || false}
                  onCheckedChange={checked =>
                    updateSettings("includeProfileContext", checked)
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label>Include Workspace Instructions</Label>
                <Switch
                  checked={chatSettings.includeWorkspaceInstructions || false}
                  onCheckedChange={checked =>
                    updateSettings("includeWorkspaceInstructions", checked)
                  }
                />
              </div>
            </div>
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
