import { createReactAgent } from "@langchain/langgraph/prebuilt";
import { ChatOpenAI } from "@langchain/openai";
import { createFileRoute } from "@tanstack/react-router";
import { useCallback, useMemo, useState } from "react";
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
	const [isStreaming, setIsStreaming] = useState(false);
	const [streamBuffer, setStreamBuffer] = useState<string>("");

	const processToAgent = useCallback(
		async (input: string) => {
			setIsStreaming(true);
			setStreamBuffer("");
			try {
				// @ts-ignore stream API; iterate async for tokens
				const stream = await agent.stream({
					messages: [{ role: "user", content: input }],
				});
				// Expect the stream itself to be an AsyncIterable of chunk-like objects.
				for await (const chunk of stream as AsyncIterable<unknown>) {
					// Narrow chunk shape
					type ChunkShape = { content?: unknown; delta?: unknown } | string;
					const c = chunk as ChunkShape;
					let token = "";
					if (typeof c === "string") token = c;
					else if (typeof c.content === "string") token = c.content;
					else if (typeof c.delta === "string") token = c.delta;
					if (token) setStreamBuffer((prev) => prev + token);
				}
				// Finalize assistant message
				setConversations((prev) => [
					...prev,
					{ role: "assistant", content: ((prev) => prev)(streamBuffer) },
				]);
				setStreamBuffer("");
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
				setIsStreaming(false);
			}
		},
		[agent, streamBuffer],
	);

	const handleSendInput = useCallback(
		(value: string) => {
			if (!value.trim() || isStreaming) return;
			const userMessage: IConversation = { role: "user", content: value };
			setConversations((prev) => [...prev, userMessage]);
			processToAgent(value);
		},
		[processToAgent, isStreaming],
	);

	return (
		<main className="container mx-auto flex flex-col h-screen justify-end gap-4 py-6">
			<section className="flex-1 overflow-y-auto border rounded-md p-4 space-y-3 bg-muted/20">
				{conversations.length === 0 && (
					<p className="text-sm text-muted-foreground italic">
						Start the conversation…
					</p>
				)}
				{conversations.map((m) => (
					<div
						key={`${m.role}-${m.content.slice(0, 20)}-${m.content.length}`}
						className={`text-sm leading-relaxed whitespace-pre-wrap ${
							m.role === "user" ? "text-foreground" : "text-muted-foreground"
						}`}
					>
						<strong className="mr-1 capitalize">{m.role}:</strong>
						{m.content}
					</div>
				))}
				{isStreaming && streamBuffer && (
					<div className="text-sm leading-relaxed whitespace-pre-wrap text-muted-foreground">
						<strong className="mr-1 capitalize">assistant:</strong>
						{streamBuffer}
						<span className="ml-1 animate-pulse">▌</span>
					</div>
				)}
			</section>
			<ChatInput onSendInput={handleSendInput} disabled={isStreaming} />
		</main>
	);
}
