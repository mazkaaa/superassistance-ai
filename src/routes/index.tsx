import type { MessageContent } from "@langchain/core/messages";
import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
import ChatBubble from "@/components/chat-bubble";
import ChatInput from "@/components/chat-input";
import { env } from "@/env";

export const Route = createFileRoute("/")({
	component: App,
});

interface IConversation {
	role: "user" | "assistant" | "system";
	content: string;
}

function App() {
	const [isLoading, setIsLoading] = useState(false);

	// NOTE: Vite only exposes env vars prefixed with VITE_. Consider renaming OPENAI_API_KEY to VITE_OPENAI_API_KEY.
	const model = useMemo(
		() =>
			new ChatOpenAI({
				temperature: 0.6,
				model: "deepseek/deepseek-chat-v3.1:free",
				configuration: {
					apiKey: env.VITE_OPENAI_API_KEY,
					baseURL: "https://openrouter.ai/api/v1",
				},
				streaming: false,
			}),
		[],
	);

	// Type mismatch workaround: current ChatOpenAI version lacks newer Runnable private fields expected by createReactAgent.
	// Casting until dependency versions align.
	// createReactAgent expects a LanguageModelLike; ChatOpenAI implements BaseLanguageModel.
	// If type mismatch persists due to version skew, we can wrap in a function returning model.
	// Version skew between @langchain/openai and @langchain/langgraph types can make ChatOpenAI
	// appear incompatible even though at runtime it implements the Runnable interface.
	const agent = useMemo(() => {
		// @ts-ignore
		return createReactAgent({ llm: model, tools: [] });
	}, [model]);

	const [conversations, setConversations] = useState<IConversation[]>([]);

	const processToAgent = useCallback(
		async (input: string) => {
			try {
				setIsLoading(true);
				const response = await agent.invoke({
					messages: [{ role: "user", content: input }],
				});
				setConversations((prev) => [
					...prev,
					{
						role: "assistant",
						content: response.messages[1].content.toString(),
					},
				]);
			} catch (e) {
				console.error("Streaming error", e);
				setConversations((prev) => [
					...prev,
					{
						role: "assistant",
						content: "(Error generating response)",
					},
				]);
			} finally {
				setIsLoading(false);
			}
		},
		[agent],
	);

	const handleSendInput = useCallback(
		(value: string) => {
			if (!value.trim()) return;
			const userMessage: IConversation = { role: "user", content: value };
			setConversations((prev) => [...prev, userMessage]);
			processToAgent(value);
		},
		[processToAgent],
	);

	return (
		<main className="container mx-auto flex flex-col h-screen justify-end gap-4 py-6">
			<section className="flex-1 overflow-y-auto border rounded-md p-4 space-y-3 bg-muted/20">
				{conversations.map((m) => (
					<ChatBubble
						key={`${m.role}-${m.content.slice(0, 20)}-${m.content.length}`}
						role={m.role === "user" ? "user" : "assistant"}
						className={m.role === "assistant" ? "" : "ml-auto"}
						content={m.content}
					/>
				))}
			</section>
			<ChatInput onSendInput={handleSendInput} isLoading={isLoading} />
		</main>
	);
}
