import { Button } from "@/components/ui/button"
import { useCopyToClipboard } from "@/lib/hooks/use-copy-to-clipboard"
import { IconCheck, IconCopy } from "@tabler/icons-react"
import { FC, memo } from "react"
import { Prism as SyntaxHighlighter } from "react-syntax-highlighter"
import { oneDark } from "react-syntax-highlighter/dist/cjs/styles/prism"

interface MessageCodeBlockProps {
  language: string
  value: string
}

export const MessageCodeBlock: FC<MessageCodeBlockProps> = memo(
  ({ language, value }) => {
    const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 })

    const onCopy = () => {
      if (isCopied) return
      copyToClipboard(value)
    }

    return (
      <div className="group relative w-full font-mono bg-transparent">
        <div className="flex w-full items-center justify-between py-1 border-b border-white/5 mb-2">
          <span className="text-[10px] uppercase tracking-widest text-white/30">{language}</span>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6 text-white/20 hover:text-white/60 transition-colors"
            onClick={onCopy}
          >
            {isCopied ? <IconCheck size={12} /> : <IconCopy size={12} />}
          </Button>
        </div>

        <SyntaxHighlighter
          language={language}
          style={oneDark}
          customStyle={{
            margin: 0,
            width: "100%",
            background: "transparent",
            padding: "0"
          }}
          codeTagProps={{
            style: {
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              lineHeight: "1.6"
            }
          }}
        >
          {value}
        </SyntaxHighlighter>
      </div>
    )
  }
)

MessageCodeBlock.displayName = "MessageCodeBlock"
