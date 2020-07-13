const webpack = require("webpack");
const {
	override,
	addDecoratorsLegacy,
	addBabelPlugins,
	useEslintRc,
	addWebpackPlugin
} = require("customize-cra");
const path = require("path");

module.exports = override(
	addDecoratorsLegacy(),
	...addBabelPlugins(
		"@babel/plugin-proposal-logical-assignment-operators",
		"@babel/plugin-proposal-nullish-coalescing-operator",
		"@babel/plugin-proposal-optional-chaining"
	),
	addWebpackPlugin(new webpack.ProvidePlugin({
		THREE: "three"
	})),
	useEslintRc(path.resolve(__dirname, "package.json"))
);
