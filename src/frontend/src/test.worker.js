import '@babel/polyfill';

import WasmWrapper from '../../../../renderers-web/src/wasm-wrapper.js';



onmessage = async (message) =>
{
	const { id, code, memory } = message.data;

	const wasm = new WasmWrapper();

	await wasm.init(code, memory, false);



	switch (id)
	{
	case 0:

		setInterval(wasm.exports.updateTransitions0);

		break;

	case 1:

		setInterval(wasm.exports.updateTransitions1);

		break;

	default:
	}
};
