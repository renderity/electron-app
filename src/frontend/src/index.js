/*
eslint-disable

max-statements,
*/



import './index.scss';
import '@babel/polyfill';

// import * as dat from 'dat.gui';

// import TestWorker from 'worker-loader!./test.worker.js';

// import WasmWrapper from '../../../../renderers-web/src/wasm-wrapper.js';
// import WebGL from '../../../../renderers-web/src/webgl-renderer.js';
// import WebGPU from '../../../../renderers-web/src/webgpu-renderer.js';

// import wasm_code from './cpp/src/entry-wasm32.cpp';



// const dat_gui = new dat.GUI();

// const gui_options =
// {
// 	API: 'webgl',
// };

// const gui_options_API = {};



// const threads = [ ...new Array(2) ].map(() => new TestWorker());



// window.addEventListener
// (
// 	'load',

// 	async () =>
// 	{
// 		LOG(window.navigator.hardwareConcurrency);

// 		const memory = new WebAssembly.Memory({ initial: 2, maximum: 2, shared: true });

// 		const wasm = new WasmWrapper();

// 		await wasm.init(wasm_code, memory);

// 		// wasm.exports.setWindowSize(window.innerWidth / 2, window.innerHeight);

// 		wasm.exports.initTransitionStack();

// 		wasm.exports._Z19constructRenderityWrappersv();



// 		threads.forEach
// 		((thread, thread_index) => thread.postMessage({ id: thread_index, code: wasm_code, memory }));



// 		const renderer_addr = wasm.Addr(wasm.exports.renderer.value);
// 		const scene_addr = wasm.Addr(wasm.exports.scene.value);
// 		const material_addr = wasm.Addr(wasm.exports.material.value);
// 		const material2_addr = wasm.Addr(wasm.exports.material2.value);
// 		const uniform_block0_addr = wasm.Addr(wasm.exports.uniform_block0.value);
// 		const object_addr = wasm.Addr(wasm.exports._object.value);
// 		const object2_addr = wasm.Addr(wasm.exports.object2.value);
// 		const desc_set1_addr = wasm.Addr(wasm.exports.desc_set1.value);
// 		const desc_set2_addr = wasm.Addr(wasm.exports.desc_set2.value);



// 		const orbit = wasm.Addr(wasm.exports.orbit.value);
// 		const orbit2 = wasm.Addr(wasm.exports.orbit2.value);



// 		// window.addEventListener
// 		// (
// 		// 	'mousemove',

// 		// 	(evt) =>
// 		// 	{
// 		// 		wasm.exports._ZN3RS4MATH5Orbit7rotate2Eff(orbit, evt.movementX * 0.01, evt.movementY * 0.01);
// 		// 		wasm.exports._ZN3RS4MATH5Orbit6updateEv(orbit);

// 		// 		wasm.exports.startTransition();
// 		// 	},
// 		// );



// 		let renderer_native = null;
// 		let renderer_webgl = null;
// 		let renderer_webgl2 = null;
// 		let renderer_webgpu = null;



// 		{
// 			const webgl = new WebGL(wasm);

// 			const renderer =
// 				new webgl.Renderer(renderer_addr, document.querySelectorAll('canvas')[0], 'webgl');

// 			if (renderer.exists)
// 			{
// 				gui_options_API.WebGL = 'webgl';

// 				renderer_webgl = renderer;
// 				renderer_native = renderer_webgl;

// 				gui_options.API = 'webgl';



// 				const gl = renderer._context;



// 				const
// 					{
// 						Scene,
// 						Material,
// 						Object,
// 					} = renderer;

// 				const scene = Scene.getInstance(scene_addr);
// 				const material = Material.getInstance(material_addr);
// 				const material2 = Material.getInstance(material2_addr);
// 				const _object = Object.getInstance(object_addr);
// 				const object2 = Object.getInstance(object2_addr);



// 				const b = gl.createBuffer();

// 				gl.bindBuffer(gl.ARRAY_BUFFER, b);
// 				gl.bufferData(gl.ARRAY_BUFFER, scene.vertex_data, gl.STATIC_DRAW);
// 				gl.vertexAttribPointer(0, 3, gl.FLOAT, 0, 0, 0);

// 				gl.enableVertexAttribArray(0);



// 				let time = Date.now();

// 				const [ fps ] = document.querySelectorAll('.fps');

// 				let fps_counter = 0;

// 				renderer.loop_function = () =>
// 				{
// 					gl.clear(gl.COLOR_BUFFER_BIT);

// 					material.use();

// 					_object.draw();

// 					material2.use();

// 					object2.draw();



// 					if (Math.floor((Date.now() - time) * 0.001))
// 					{
// 						fps.innerHTML = fps_counter;

// 						fps_counter = 0;

// 						time = Date.now();
// 					}

// 					++fps_counter;
// 				};
// 			}
// 		}



// 		{
// 			const webgl = new WebGL(wasm);

// 			const renderer =
// 				new webgl.Renderer(renderer_addr, document.querySelectorAll('canvas')[1], 'webgl2');

// 			if (renderer.exists)
// 			{
// 				gui_options_API.WebGL2 = 'webgl2';

// 				renderer_webgl2 = renderer;
// 				renderer_native = renderer_webgl2;

// 				gui_options.API = 'webgl2';



// 				const gl = renderer._context;



// 				const
// 					{
// 						Scene,
// 						Material,
// 						UniformBlock,
// 						Object,
// 					} = renderer;



// 				const scene = Scene.getInstance(scene_addr);
// 				const material = Material.getInstance(material_addr);
// 				const material2 = Material.getInstance(material2_addr);
// 				const uniform_block0 = UniformBlock.getInstance(uniform_block0_addr);
// 				const _object = Object.getInstance(object_addr);
// 				const object2 = Object.getInstance(object2_addr);



// 				const b = gl.createBuffer();

// 				gl.bindBuffer(gl.ARRAY_BUFFER, b);
// 				gl.bufferData(gl.ARRAY_BUFFER, scene.vertex_data, gl.STATIC_DRAW);
// 				gl.vertexAttribPointer(0, 3, gl.FLOAT, 0, 0, 0);

// 				gl.enableVertexAttribArray(0);



// 				let time = Date.now();

// 				const [ , fps ] = document.querySelectorAll('.fps');

// 				let fps_counter = 0;

// 				renderer.loop_function = () =>
// 				{
// 					gl.clear(gl.COLOR_BUFFER_BIT);

// 					uniform_block0.use();

// 					material.use();

// 					_object.draw();

// 					material2.use();

// 					object2.draw();




// 					if (Math.floor((Date.now() - time) * 0.001))
// 					{
// 						fps.innerHTML = fps_counter;

// 						fps_counter = 0;

// 						time = Date.now();
// 					}

// 					++fps_counter;
// 				};
// 			}
// 		}



// 		{
// 			const webgpu = new WebGPU(wasm);

// 			const renderer =
// 				new webgpu.Renderer
// 				(
// 					renderer_addr,

// 					{
// 						canvas: document.querySelectorAll('canvas')[2],
// 					},
// 				);

// 			if (renderer.exists)
// 			{
// 				gui_options_API.WebGPU = 'webgpu';

// 				renderer_webgpu = renderer;
// 				renderer_native = renderer_webgpu;

// 				gui_options.API = 'webgpu';

// 				await renderer.init();



// 				const
// 					{
// 						Scene,
// 						Material,
// 						// UniformBlock,
// 						DescriptorSet,
// 						Object,
// 					} = renderer;



// 				const scene = Scene.getInstance(scene_addr);
// 				const material = Material.getInstance(material_addr, Material.ShaderUsage.GLSL_VULKAN);
// 				const material2 = Material.getInstance(material2_addr, Material.ShaderUsage.GLSL_VULKAN);
// 				// const uniform_block0 = UniformBlock.getInstance(uniform_block0_addr);
// 				const desc_set1 = DescriptorSet.getInstance(desc_set1_addr);
// 				const desc_set2 = DescriptorSet.getInstance(desc_set2_addr);
// 				const _object = Object.getInstance(object_addr);
// 				const object2 = Object.getInstance(object2_addr);



// 				const c =
// 					renderer.device.createBuffer
// 					({
// 						size: scene.vertex_data.byteLength,

// 						usage:
// 						(
// 							window.GPUBufferUsage.COPY_DST |
// 							window.GPUBufferUsage.VERTEX
// 						),
// 					});

// 				renderer.device.queue.writeBuffer(c, 0, scene.vertex_data, 0, scene.vertex_data.length);



// 				let time = Date.now();

// 				const [ ,, fps ] = document.querySelectorAll('.fps');

// 				let fps_counter = 0;

// 				renderer.loop_function = () =>
// 				{
// 					const command_encoder = renderer.device.createCommandEncoder();

// 					const context_texture = renderer._context.getCurrentTexture();

// 					renderer.render_pass_encoder =
// 						command_encoder.beginRenderPass
// 						({
// 							colorAttachments:
// 							[
// 								{
// 									view: context_texture.createView(),
// 									// GPUTextureView resolveTarget;

// 									loadValue: [ 1, 1, 1, 1 ],
// 									storeOp: 'store',
// 								},
// 							],
// 						});

// 					renderer.render_pass_encoder.setVertexBuffer(0, c, 0, scene.vertex_data.byteLength);

// 					desc_set1.use(0);

// 					material.use();

// 					_object.draw();

// 					desc_set2.use(0);

// 					material2.use();

// 					object2.draw();

// 					renderer.render_pass_encoder.endPass();

// 					const command_buffer = command_encoder.finish();

// 					renderer.device.queue.submit([ command_buffer ]);



// 					if (Math.floor((Date.now() - time) * 0.001))
// 					{
// 						fps.innerHTML = fps_counter;

// 						fps_counter = 0;

// 						time = Date.now();
// 					}

// 					++fps_counter;
// 				};
// 			}
// 		}



// 		{

// 		}



// 		dat_gui
// 			.add(gui_options, 'API', gui_options_API)
// 			.onChange
// 			(
// 				(value) =>
// 				{
// 					renderer_native.endLoop();

// 					renderer_native.canvas.parentNode.style.display = 'none';

// 					switch (value)
// 					{
// 					case 'webgl':
// 					{
// 						renderer_native = renderer_webgl;

// 						break;
// 					}

// 					case 'webgl2':
// 					{
// 						renderer_native = renderer_webgl2;

// 						break;
// 					}

// 					case 'webgpu':
// 					{
// 						renderer_native = renderer_webgpu;

// 						break;
// 					}

// 					default:
// 					}

// 					renderer_native.canvas.parentNode.style.display = 'block';

// 					renderer_native.startLoop();
// 				},
// 			);

// 		renderer_native.canvas.parentNode.style.display = 'block';



// 		// wasm.exports.initTransitionStack();

// 		const updateOrbit = () =>
// 		{
// 			// wasm.exports._ZN3RS4MATH5Orbit7rotate2Eff(orbit, 0.01, 0.01);
// 			// wasm.exports._ZN3RS4MATH5Orbit6updateEv(orbit);

// 			// wasm.exports._ZN3RS4MATH5Orbit7rotate2Eff(orbit2, 0.01, 0.01);
// 			// wasm.exports._ZN3RS4MATH5Orbit6updateEv(orbit2);

// 			// wasm.exports.updateTransitions();

// 			requestAnimationFrame(updateOrbit);
// 		};

// 		updateOrbit();

// 		setTimeout(wasm.exports.startTransition, 3000);
// 		setTimeout(wasm.exports.startTransition2, 4000);

// 		// setInterval(wasm.exports.logStacks, 100);



// 		renderer_native.startLoop();
// 	},
// );



const
	{
		testRenderingThread,
		runRenderingThread,
		getPixelDataStorageIsAllocated,
		getRendererSize,
		getPixelDataStorage,
		// rotateOrbitJs,
	}	= window.__CPP_MODULE__;



// const rotateOrbit = (evt) =>
// {
// 	rotateOrbitJs(-evt.movementX * 0.01, -evt.movementY * 0.01);
// };

// const stopOrbitRotation = () =>
// {
// 	window.removeEventListener('mousemove', rotateOrbit);
// 	window.removeEventListener('mouseup', stopOrbitRotation);
// };

// canvas.addEventListener
// (
// 	'mousedown',

// 	() =>
// 	{
// 		window.addEventListener('mousemove', rotateOrbit);
// 		window.addEventListener('mouseup', stopOrbitRotation);
// 	},
// );

// window.addEventListener('mouseup', stopOrbitRotation);



window.addEventListener
(
	'load',

	async () =>
	{
		// Redundant? Does reloading of window cause killing of all processes and
		// threads spawned from them, so rendering thread does never exist
		// after reloading?
		if (!testRenderingThread())
		{
			runRenderingThread();
		}

		let interval = null;

		await new Promise
		(
			(resolve) =>
			{
				interval =
					setInterval
					(
						() =>
						{
							if (getPixelDataStorageIsAllocated())
							{
								clearInterval(interval);

								resolve();
							}
						},

						1000,
					);
			},
		);

		const { renderer_width, renderer_height } = getRendererSize();

		const canvas = document.querySelector('#offscreen-canvas');
		canvas.width = renderer_width;
		canvas.height = renderer_height;
		canvas.style.width = `${ renderer_width }px`;
		canvas.style.height = `${ renderer_height }px`;

		const canvas_context = canvas.getContext('2d');

		const image_data = canvas_context.createImageData(renderer_width, renderer_height);

		const pixel_data_storage = getPixelDataStorage();

		const render = () =>
		{
			image_data.data.set(pixel_data_storage);

			canvas_context.putImageData(image_data, 0, 0);

			requestAnimationFrame(render);
		};

		canvas.parentNode.style.display = 'block';

		render();
	},
);
