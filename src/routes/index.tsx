import { createFileRoute } from "@tanstack/react-router";

export const Route = createFileRoute("/")({
	component: App,
});

function App() {
	return (
		<main>
			<h2>Homepage</h2>
		</main>
	);
}
