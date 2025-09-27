import Markdown from "react-markdown";
import { cn } from "@/lib/utils";

interface ChatBubbleProps {
	content: string;
	role: "user" | "assistant";
	className?: string;
}
const ChatBubble = (props: ChatBubbleProps) => {
	return (
		<div
			className={cn(
				"flex w-max max-w-[75%] flex-col gap-2 rounded-lg px-3 py-2 text-sm",
				props.role === "user"
					? "bg-primary text-primary-foreground"
					: "bg-muted",
				props.className,
				"[&>ul]:list-disc [&>ul]:pl-5 [&>ul]:marker:text-primary/70 [&>ol]:list-decimal [&>ol]:pl-5 [&>ol]:marker:text-primary/70 [&>a]:text-primary/70 [&>a]:underline [&>code]:bg-muted/50 [&>code]:px-1 [&>code]:py-0.5 [&>code]:rounded-sm [&>pre]:bg-muted/50 [&>pre]:p-2 [&>pre]:rounded-md [&>pre]:overflow-x-auto",
			)}
		>
			<Markdown>{props.content}</Markdown>
		</div>
	);
};

export default ChatBubble;
