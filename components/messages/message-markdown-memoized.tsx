import { FC, memo } from "react"
import ReactMarkdown, { Options } from "react-markdown"
import remarkMath from "remark-math"
import rehypeKatex from "rehype-katex"
import "katex/dist/katex.min.css"

export const MessageMarkdownMemoized: FC<Options> = memo(
  ReactMarkdown,
  (prevProps, nextProps) =>
    prevProps.children === nextProps.children &&
    prevProps.className === nextProps.className
)

/* Fix: The memoized component above wraps ReactMarkdown directly, preventing us from injecting plugins easily via props defaulting in the component definition.
   We should wrap it to include the plugins by default or modify the usage site.
   However, looking at the code, `MessageMarkdownMemoized` IS `ReactMarkdown` but memoized.
   To add plugins, we need to return a component that renders ReactMarkdown with plugins.
*/

export const MessageMarkdown = memo((props: Options) => (
  <ReactMarkdown
    {...props}
    remarkPlugins={[remarkMath, ...(props.remarkPlugins || [])]}
    rehypePlugins={[rehypeKatex, ...(props.rehypePlugins || [])]}
    components={{
      p: ({ children }) => <p className="mb-2 last:mb-0">{children}</p>,
      ...props.components
    }}
  >
    {props.children}
  </ReactMarkdown>
), (prev, next) => prev.children === next.children && prev.className === next.className);
