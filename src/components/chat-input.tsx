import { Forward } from "lucide-react";
import type React from "react";
import { useCallback, useRef, useState } from "react";
import { Button } from "./ui/button";
import { Textarea } from "./ui/textarea";

interface ChatInputProps {
	onSendInput: (value: string) => void;
	disabled?: boolean;
}
const ChatInput = (props: ChatInputProps) => {
	const [isMultiline, setIsMultiline] = useState(false);
	const [inputValue, setInputValue] = useState("");

	const textareaRef = useRef<HTMLTextAreaElement | null>(null);

	const recalc = useCallback(() => {
		const el = textareaRef.current;
		if (!el) return;
		// Reset height to recalc natural content height
		el.style.height = "auto";
		const style = window.getComputedStyle(el);
		const lineHeight = Number.parseFloat(style.lineHeight) || 20; // fallback
		const paddingTop = Number.parseFloat(style.paddingTop) || 0;
		const paddingBottom = Number.parseFloat(style.paddingBottom) || 0;
		const singleLineHeight = lineHeight + paddingTop + paddingBottom;
		const maxHeight = 300; // cap like chat apps
		const needed = Math.min(el.scrollHeight, maxHeight);
		el.style.height = `${needed}px`;
		el.style.overflowY = el.scrollHeight > maxHeight ? "auto" : "hidden";
		// Determine if multiline: newline present OR scrollHeight notably bigger than single line
		const multi =
			el.value.includes("\n") || el.scrollHeight > singleLineHeight + 4;
		setIsMultiline(multi);
	}, []);

	const onChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
		setInputValue(e.target.value);
		recalc();
	};

	const submit = useCallback(() => {
		console.log("Submitting message:", inputValue);
		props.onSendInput(inputValue);
		setInputValue("");
		requestAnimationFrame(() => recalc());
	}, [recalc, inputValue.trim, props.onSendInput, inputValue]);

	const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
		if (e.key === "Enter" && !e.shiftKey) {
			e.preventDefault();
			submit();
		}
	};

	return (
		<div id="chat-input" className="relative flex">
			<Textarea
				ref={textareaRef}
				id="chat-textarea"
				placeholder="Type your message here..."
				value={inputValue}
				onChange={onChange}
				onKeyDown={onKeyDown}
				rows={1}
				disabled={props.disabled}
				className="w-full resize-none min-h-14 max-h-72 pr-14 pl-5 leading-relaxed text-base! py-3"
			/>
			<Button
				size={"icon"}
				onClick={submit}
				disabled={props.disabled || !inputValue.trim()}
				className={`absolute right-3 transition-all ${
					isMultiline ? "bottom-3" : "top-1/2 -translate-y-1/2"
				}`}
			>
				<Forward />
			</Button>
		</div>
	);
};

export default ChatInput;
