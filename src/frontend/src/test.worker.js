import '@babel/polyfill';

import WasmWrapper from '../../../../renderers-web/src/wasm-wrapper.js';



onmessage = async (message) =>
{
	const wasm = new WasmWrapper();

	const { thread_index, wasm_code, wasm_memory } = message.data;

	await wasm.init(wasm_code, wasm_memory, false);



	switch (thread_index)
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
