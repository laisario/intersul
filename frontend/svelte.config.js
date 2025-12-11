import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),

	kit: {
		// adapter-static: gera site estático para hospedagem compartilhada
		// fallback: 'app.html' - modo SPA, todas as rotas servem app.html
		adapter: adapter({
			fallback: 'app.html',
		}),
		alias: {
			"@/*": "./path/to/lib/*",
		},
	}
};

export default config;
