const fs = require('fs');
const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const OptimizeCSSAssetsPlugin = require('optimize-css-assets-webpack-plugin');
const CopyPlugin = require('copy-webpack-plugin');



module.exports = (env) =>
	({
		entry: [ '@babel/runtime/regenerator', './src/index.js' ],

		target: 'web',

		// Warkaround for upating browser on C++ files changes.
		// Maybe prevent caching only for C++ modules?
		cache: false,

		resolve:
		{
			extensions: [ '.js', '.scss' ],
		},

		output:
		{
			path: path.join(__dirname, 'build'),
		},

		module:
		{
			rules:
			[
				{
					test: /\.js$/,
					exclude: /node_modules/,

					use:

						env.development ?

							[
								{
									loader: 'babel-loader',

									// workaround for correct transpiling glkit when linking from local directory
									options: JSON.parse(fs.readFileSync('.babelrc')),
								},
							] :

							[
								'babel-loader',
								'eslint-loader',
							],
				},

				{
					test: /\.scss$/,

					use:
					[
						MiniCssExtractPlugin.loader,
						// to insert css into html
						// 'style-loader',
						'css-loader',
						'sass-loader',
					],
				},

				{
					test: /\.pug$/,

					use:
					[
						'html-loader',
						'pug-html-loader',
					],
				},

				{
					test: /\.html$/,
					use: { loader: 'html-loader', options: { minimize: true } },
				},

				{
					test: /\.(png|jpg|jpeg)$/,
					use: 'base64-inline-loader',
				},

				{
					test: /\.cpp$/,
					use: '../../../cpp-webpack-loader/index.js',
				},
			],
		},

		devtool: env.development ? 'source-map' : false,

		plugins:
		[
			new CleanWebpackPlugin(),

			new MiniCssExtractPlugin({ filename: 'index.css' }),

			new OptimizeCSSAssetsPlugin({}),

			new HtmlWebpackPlugin
			(
				{
					filename: path.join(__dirname, 'build/index.html'),
					template: path.join(__dirname, 'src/index.pug'),
					inject: 'body',

					minify:
					{
						removeAttributeQuotes: true,
					},
				},
			),

			new CopyPlugin
			({
				patterns:
				[
					{ from: 'src/public', to: 'public' },
				],
			}),

			new webpack.DefinePlugin
			({
				LOG: 'console.log',
			}),
		],

		devServer:
		{
			compress: true,
			// hot: false,
			// liveReload: false,
			historyApiFallback: true,
			host: 'localhost',
			port: 8080,
			// open: true,

			// Enable using shared array buffers.
			headers:
			{
				'Cross-Origin-Opener-Policy': 'same-origin',
				'Cross-Origin-Embedder-Policy': 'require-corp',
			},
		},
	});
