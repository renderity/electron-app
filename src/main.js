/*
eslint-disable

no-process-env,
*/



const path = require('path');
const child_process = require('child_process');
const readline = require('readline');
const chokidar = require('chokidar');

const
	{
		app,
		BrowserWindow,
		// globalShortcut,
	} = require('electron');



// app.commandLine.appendArgument('--experimental-wasm-simd');



// const RS_TEST_SRC = path.join(__dirname, '../../test/src');
// const PATH_ADDONS_NODE_API_TEST_SRC = path.join(__dirname, 'addons/test-cpp/src');



let window = null;



const createWindow = () =>
{
	window = new BrowserWindow
	(
		{
			width: 800,
			height: 600,

			webPreferences:
			{
				preload: path.join(__dirname, 'preload.js'),

				// Unify nodejs and chromium memory spaces.
				contextIsolation: false,
				webSecurity: false,
			},
		},
	);

	window.setFullScreen(true);

	// Run frontend as regular web app
	// deployed on localhost with webpack-dev-server
	if (process.env.__ELECTRON_LOCAL__)
	// if (true)
	{
		window.toggleDevTools();

		window.loadURL('http://localhost:8080');
	}
	else
	{
		window.loadFile(path.join(__dirname, 'frontend/build/index.html'));
	}
};

if (process.env.__ELECTRON_LOCAL__)
// if (true)
{
	if (process.platform === 'win32')
	{
		const rl =
			readline
				.createInterface
				(
					{
						input: process.stdin,
						output: process.stdout,
					},
				);

		rl.on
		(
			'SIGINT',

			() =>
			{
				process.emit('SIGINT');
			},
		);
	}

	const killNode = () =>
	{
		console.log('KILL NODE');
		// Killing all node processes on linux and windows
		// Find a better cross-OS way to kill frontend process ?
		switch (process.platform)
		{
		case 'linux':

			child_process.execSync('killall -9 node');

			break;

		case 'win32':

			child_process.execSync('taskkill /F /IM node.exe /T');

			break;

		default:
		}
	};

	const buildAddonTestCpp = async () =>
	{
		await new Promise
		(
			(resolve) =>
			{
				console.log('test-cpp PROCESS STDOUT:');

				const testcpp_process =
					child_process
						.spawn
						(`cd ${ __dirname } && npm run build:addon:test-cpp`, { shell: true });

				testcpp_process.stdout.on
				(
					'data',

					(_data) => console.log(`${ _data }`),
				);

				testcpp_process.stderr.on
				(
					'data',

					(_data) => console.log('\x1b[31m', `${ _data }`),
				);

				testcpp_process.on('close', resolve);
			},
		);
	};

	app
		.whenReady()
		.then
		(
			async () =>
			{
				process.on('exit', killNode);

				if (process.platform === 'win32')
				{
					process.on('SIGINT', killNode);
				}

				await buildAddonTestCpp();

				console.log('FRONTEND PROCESS STDOUT:');

				const frontend_process =
					child_process
						.spawn
						(`cd ${ __dirname } && npm run start:frontend`, { shell: true });

				frontend_process.stdout.on
				(
					'data',

					(_data) =>
					{
						console.log(`${ _data }`);

						window.reload();
					},
				);

				createWindow();

				if (process.platform === 'linux')
				{
					// Watch non-frontend modules.
					// Frontend is watched by webpack.
					chokidar
						.watch
						(
							[
								// RS_TEST_SRC,
								// PATH_ADDONS_NODE_API_TEST_SRC,
								path.join(__dirname, '../../math/src'),
								path.join(__dirname, '../../aux/src'),
								path.join(__dirname, '../../wrappers/src'),
								path.join(__dirname, '../../renderers/src'),
								path.join(__dirname, '../../test/src'),
								path.join(__dirname, 'addons/test-cpp/src'),
							],
						)
						.on
						(
							'change',

							// async (evt) =>
							async () =>
							{
								// if
								// (
								// 	evt.includes(RS_TEST_SRC) ||
								// 	evt.includes(PATH_ADDONS_NODE_API_TEST_SRC)
								// )
								// {
								await buildAddonTestCpp();

								window.close();

								createWindow();
								// }
							},
						);
				}
			},
		);
}
else
{
	app
		.whenReady()
		.then(createWindow);
}
