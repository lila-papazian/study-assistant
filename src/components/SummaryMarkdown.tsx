import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

interface SummaryMarkdownProps {
    content: string;
}

export default function SummaryMarkdown({
    content,
}: SummaryMarkdownProps) {
    return (
        <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {content}
        </ReactMarkdown>
    );
}