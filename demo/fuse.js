const {
    FuseBox,
	SassPlugin,
	CSSPlugin,
	WebIndexPlugin,
	TypeScriptHelpers,
	JSONPlugin,
	HTMLPlugin
} = require('fuse-box');

const fuse = FuseBox.init({
	homeDir: `..`,
	output: `dist/$name.js`,
	plugins: [
		WebIndexPlugin({
			title: "",
			template: "index.html"
		}), [
			SassPlugin({ outputStyle: 'compressed' }),
			CSSPlugin()
		],
		TypeScriptHelpers(),
		JSONPlugin()
	]
});

// setup development sever
fuse.dev({ port: 4445 });

// bundle application
fuse.bundle("app")
	.sourceMaps(true)
	.instructions(" > demo/main.ts")
	.watch('demo/**')
	.hmr();

// run the factory
fuse.run();
