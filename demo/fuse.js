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
			template: "src/index.html"
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
	.instructions(" > demo/src/main.ts")
	.watch('demo/src/**|lib/**')
	.hmr();

// run the factory
fuse.run();
