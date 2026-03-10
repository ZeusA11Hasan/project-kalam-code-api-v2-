"use client"

import {
    Tooltip,
    TooltipContent,
    TooltipTrigger
} from "@/components/ui/tooltip"
import { FC, ReactNode } from "react"

interface WithTooltipProps {
    children: ReactNode
    trigger: ReactNode
    delayDuration?: number
    display?: ReactNode
    side?: "left" | "right" | "top" | "bottom"
    asChild?: boolean
}

export const WithTooltip: FC<WithTooltipProps> = ({
    children,
    trigger,
    delayDuration = 500,
    display,
    side = "right",
    asChild = false
}) => {
    return (
        <Tooltip delayDuration={delayDuration}>
            <TooltipTrigger asChild={asChild}>{trigger}</TooltipTrigger>
            <TooltipContent side={side}>{display || children}</TooltipContent>
        </Tooltip>
    )
}
