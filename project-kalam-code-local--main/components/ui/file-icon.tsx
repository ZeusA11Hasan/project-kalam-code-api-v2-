import { FC } from "react"
import {
    FileCode,
    FileJson,
    FileText,
    FileType,
    Image,
    File
} from "lucide-react"

interface FileIconProps {
    type: string
    size?: number
}

export const FileIcon: FC<FileIconProps> = ({ type, size = 32 }) => {
    const iconProps = { size }

    if (type.includes("image")) {
        return <Image {...iconProps} />
    } else if (type.includes("json")) {
        return <FileJson {...iconProps} />
    } else if (
        type.includes("javascript") ||
        type.includes("typescript") ||
        type.includes("python") ||
        type.includes("html") ||
        type.includes("css")
    ) {
        return <FileCode {...iconProps} />
    } else if (type.includes("text")) {
        return <FileText {...iconProps} />
    } else if (type.includes("font")) {
        return <FileType {...iconProps} />
    }

    return <File {...iconProps} />
}
