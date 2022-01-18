/*
eslint-disable

max-statements,
no-lone-blocks,
*/



import './index.scss';
import '@babel/polyfill';

import * as dat from 'dat.gui';

import WasmWrapper from '../../../../renderers-web/src/wasm-wrapper.js';
import WebGL from '../../../../renderers-web/src/webgl-renderer.js';
import WebGPU from '../../../../renderers-web/src/webgpu-renderer.js';

import wasm_code from './cpp/src/entry-wasm32.cpp';

import TestWorker from 'worker-loader!./test.worker.js';



// Use window.navigator.hardwareConcurrency?
const threads = [ ...new Array(2) ].map(() => new TestWorker());



const dat_gui = new dat.GUI();

const gui_options =
{
	API: null,
};

const gui_options_API = {};



window.addEventListener
(
	'load',

	async () =>
	{
		const wasm = new WasmWrapper();

		const wasm_memory = new WebAssembly.Memory({ initial: 2, maximum: 2, shared: true });

		await wasm.init(wasm_code, wasm_memory);

		wasm.exports.initTransitionStack();
		wasm.exports.constructRenderityWrappers();



		threads.forEach
		((thread, thread_index) => thread.postMessage({ thread_index, wasm_code, wasm_memory }));



		const renderer_addr = wasm.Addr(wasm.exports.renderer.value);
		const scene_addr = wasm.Addr(wasm.exports.scene.value);
		const material_addr = wasm.Addr(wasm.exports.material.value);
		const material2_addr = wasm.Addr(wasm.exports.material2.value);
		const uniform_block0_addr = wasm.Addr(wasm.exports.uniform_block0.value);
		const object_addr = wasm.Addr(wasm.exports._object.value);
		const object2_addr = wasm.Addr(wasm.exports.object2.value);
		const desc_set1_addr = wasm.Addr(wasm.exports.desc_set1.value);
		const desc_set2_addr = wasm.Addr(wasm.exports.desc_set2.value);



		const orbit = wasm.Addr(wasm.exports.orbit.value);
		// const orbit2 = wasm.Addr(wasm.exports.orbit2.value);

		window.addEventListener
		(
			'mousemove',

			(evt) =>
			{
				wasm.exports._ZN4RDTY4MATH5Orbit7rotate2Eff(orbit, evt.movementX * 0.01, evt.movementY * 0.01);
				wasm.exports._ZN4RDTY4MATH5Orbit6updateEv(orbit);

				// wasm.exports.startTransition();
			},
		);



		let renderer_native = null;
		let renderer_webgl = null;
		let renderer_webgl2 = null;
		let renderer_webgpu = null;



		let useWebgl = null;

		{
			const webgl = new WebGL(wasm);

			const renderer =
				new webgl.Renderer(renderer_addr, document.querySelector('#webgl'), 'webgl');

			if (renderer.exists)
			{
				renderer_webgl = renderer;

				gui_options_API.WebGL = 'webgl';
				gui_options.API = 'webgl';



				useWebgl = () =>
				{
					renderer_native = renderer_webgl;



					const gl = renderer._context;



					const
						{
							Scene,
							Material,
							Object,
						} = renderer;

					const scene = Scene.getInstance(scene_addr);
					const material = Material.getInstance(material_addr);
					const material2 = Material.getInstance(material2_addr);
					const _object = Object.getInstance(object_addr);
					const object2 = Object.getInstance(object2_addr);



					const b = gl.createBuffer();

					renderer.gpu_resources.push([ 'deleteBuffer', b ]);

					gl.bindBuffer(gl.ARRAY_BUFFER, b);
					gl.bufferData(gl.ARRAY_BUFFER, scene.vertex_data, gl.STATIC_DRAW);
					gl.vertexAttribPointer(0, 3, gl.FLOAT, 0, 0, 0);

					gl.enableVertexAttribArray(0);



					let time = Date.now();

					const [ fps ] = document.querySelectorAll('.fps');

					let fps_counter = 0;

					renderer.loop_function = () =>
					{
						gl.clear(gl.COLOR_BUFFER_BIT);

						material.use();

						_object.draw();

						material2.use();

						object2.draw();



						if (Math.floor((Date.now() - time) * 0.001))
						{
							fps.innerHTML = fps_counter;

							fps_counter = 0;

							time = Date.now();
						}

						++fps_counter;
					};
				};
			}
		}



		let useWebgl2 = null;

		{
			const webgl = new WebGL(wasm);

			const renderer =
				new webgl.Renderer(renderer_addr, document.querySelector('#webgl2'), 'webgl2');

			if (renderer.exists)
			{
				renderer_webgl2 = renderer;

				gui_options_API.WebGL2 = 'webgl2';
				gui_options.API = 'webgl2';



				useWebgl2 = () =>
				{
					renderer_native = renderer_webgl2;



					const gl = renderer._context;



					const
						{
							Scene,
							Material,
							UniformBlock,
							Object,
						} = renderer;



					const scene = Scene.getInstance(scene_addr);
					const material = Material.getInstance(material_addr);
					const material2 = Material.getInstance(material2_addr);
					const uniform_block0 = UniformBlock.getInstance(uniform_block0_addr);
					const _object = Object.getInstance(object_addr);
					const object2 = Object.getInstance(object2_addr);



					const b = gl.createBuffer();

					renderer.gpu_resources.push([ 'deleteBuffer', b ]);

					gl.bindBuffer(gl.ARRAY_BUFFER, b);
					gl.bufferData(gl.ARRAY_BUFFER, scene.vertex_data, gl.STATIC_DRAW);
					gl.vertexAttribPointer(0, 3, gl.FLOAT, 0, 0, 0);

					gl.enableVertexAttribArray(0);



					let time = Date.now();

					const [ , fps ] = document.querySelectorAll('.fps');

					let fps_counter = 0;

					renderer.loop_function = () =>
					{
						gl.clear(gl.COLOR_BUFFER_BIT);

						uniform_block0.use();

						material.use();

						_object.draw();

						material2.use();

						object2.draw();




						if (Math.floor((Date.now() - time) * 0.001))
						{
							fps.innerHTML = fps_counter;

							fps_counter = 0;

							time = Date.now();
						}

						++fps_counter;
					};
				};
			}
		}



		let useWebgpu = null;

		{
			const webgpu = new WebGPU(wasm);

			const renderer =
				new webgpu.Renderer
				(
					renderer_addr,

					{
						canvas: document.querySelector('#webgpu'),
					},
				);

			if (renderer.exists)
			{
				renderer_webgpu = renderer;

				gui_options_API.WebGPU = 'webgpu';
				gui_options.API = 'webgpu';

				await renderer.init();



				useWebgpu = () =>
				{
					renderer_native = renderer_webgpu;



					const
						{
							Scene,
							Material,
							// UniformBlock,
							DescriptorSet,
							Object,
						} = renderer;



					const scene = Scene.getInstance(scene_addr);
					const material = Material.getInstance(material_addr, Material.ShaderUsage.GLSL_VULKAN);
					const material2 = Material.getInstance(material2_addr, Material.ShaderUsage.GLSL_VULKAN);
					// const uniform_block0 = UniformBlock.getInstance(uniform_block0_addr);
					const desc_set1 = DescriptorSet.getInstance(desc_set1_addr);
					const desc_set2 = DescriptorSet.getInstance(desc_set2_addr);
					const _object = Object.getInstance(object_addr);
					const object2 = Object.getInstance(object2_addr);



					const c =
						renderer.device.createBuffer
						({
							size: scene.vertex_data.byteLength,

							usage:
							(
								window.GPUBufferUsage.COPY_DST |
								window.GPUBufferUsage.VERTEX
							),
						});

					renderer.gpu_resources.push(c);

					renderer.device.queue.writeBuffer(c, 0, scene.vertex_data, 0, scene.vertex_data.length);



					let time = Date.now();

					const [ ,, fps ] = document.querySelectorAll('.fps');

					let fps_counter = 0;

					renderer.loop_function = () =>
					{
						const command_encoder = renderer.device.createCommandEncoder();

						const context_texture = renderer._context.getCurrentTexture();

						renderer.render_pass_encoder =
							command_encoder.beginRenderPass
							({
								colorAttachments:
								[
									{
										view: context_texture.createView(),
										// GPUTextureView resolveTarget;

										loadValue: [ 1, 1, 1, 1 ],
										storeOp: 'store',
									},
								],
							});

						renderer.render_pass_encoder.setVertexBuffer(0, c, 0, scene.vertex_data.byteLength);

						desc_set1.use(0);

						material.use();

						_object.draw();

						desc_set2.use(0);

						material2.use();

						object2.draw();

						renderer.render_pass_encoder.endPass();

						const command_buffer = command_encoder.finish();

						renderer.device.queue.submit([ command_buffer ]);



						if (Math.floor((Date.now() - time) * 0.001))
						{
							fps.innerHTML = fps_counter;

							fps_counter = 0;

							time = Date.now();
						}

						++fps_counter;
					};
				};
			}
		}



		let electron_canvas_context = null;
		let electron_image_data = null;
		let electron_animation_frame = null;

		{
			const
				{
					// testRenderingThread,
					// runRenderingThread,
					// terminateRenderingThread,
					// testPixelDataStorageIsAllocated,
					_constructRenderityWrappers,
					// getRendererSize,
					// getPixelDataStorage,
					// // rotateOrbitJs,
					getApiInfoOpengl,
					getApiInfoVulkan,
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

			const api_info_opengl = getApiInfoOpengl();
			const api_info_vulkan = getApiInfoVulkan();



			if (api_info_opengl || Object.keys(api_info_vulkan).length)
			{
				_constructRenderityWrappers();

				const canvas = document.querySelector('#offscreen');

				electron_canvas_context = canvas.getContext('2d');

				if (api_info_opengl)
				{
					gui_options_API.OpenGL = 'opengl';
				}

				if (Object.keys(api_info_vulkan).length)
				{
					Object.keys(api_info_vulkan).forEach
					(
						(key) =>
						{
							gui_options_API[`Vulkan ${ key }`] = `vulkan${ api_info_vulkan[key] }`;
						},
					);
				}
			}
		}



		dat_gui
			.add(gui_options, 'API', gui_options_API)
			.onChange
			(
				async (value) =>
				{
					const
						{
							runRenderingThread,
							terminateRenderingThread,
							testPixelDataStorageIsAllocated,
							getRendererSize,
							getPixelDataStorage,
						}	= window.__CPP_MODULE__;

					const testPixelDataStorageIsAllocatedSync = (testing_interval = 1000) =>
					{
						let interval = null;

						return new Promise
						(
							(resolve) =>
							{
								interval =
									setInterval
									(
										() =>
										{
											if (testPixelDataStorageIsAllocated())
											{
												clearInterval(interval);

												resolve();
											}
										},

										testing_interval,
									);
							},
						);
					};



					switch (value)
					{
					case 'webgl':
					{
						if (renderer_native)
						{
							renderer_native.endLoop();
							renderer_native.destroy();

							renderer_native.canvas.parentNode.style.display = 'none';

							document.querySelector('#offscreen').parentNode.style.display = 'none';
						}

						useWebgl();

						renderer_native.canvas.parentNode.style.display = 'block';

						renderer_native.startLoop();

						break;
					}



					case 'webgl2':
					{
						if (renderer_native)
						{
							renderer_native.endLoop();
							renderer_native.destroy();

							renderer_native.canvas.parentNode.style.display = 'none';

							document.querySelector('#offscreen').parentNode.style.display = 'none';
						}


						useWebgl2();

						renderer_native.canvas.parentNode.style.display = 'block';

						renderer_native.startLoop();

						break;
					}



					case 'webgpu':
					{
						if (renderer_native)
						{
							renderer_native.endLoop();
							renderer_native.destroy();

							renderer_native.canvas.parentNode.style.display = 'none';

							document.querySelector('#offscreen').parentNode.style.display = 'none';
						}


						useWebgpu();

						renderer_native.canvas.parentNode.style.display = 'block';

						renderer_native.startLoop();

						break;
					}



					case 'opengl':
					{
						if (renderer_native)
						{
							renderer_native.endLoop();
							renderer_native.destroy();

							renderer_native.canvas.parentNode.style.display = 'none';
						}

						cancelAnimationFrame(electron_animation_frame);

						terminateRenderingThread();

						runRenderingThread('opengl');

						await testPixelDataStorageIsAllocatedSync();

						const pixel_data_storage = getPixelDataStorage();

						const { renderer_width, renderer_height } = getRendererSize();

						const canvas = document.querySelector('#offscreen');
						canvas.width = renderer_width;
						canvas.height = renderer_height;
						canvas.style.width = `${ renderer_width }px`;
						canvas.style.height = `${ renderer_height }px`;

						electron_image_data = electron_canvas_context.createImageData(renderer_width, renderer_height);

						const render = () =>
						{
							electron_image_data.data.set(pixel_data_storage);

							electron_canvas_context.putImageData(electron_image_data, 0, 0);

							electron_animation_frame = requestAnimationFrame(render);
						};

						render();

						document.querySelector('#offscreen').parentNode.style.display = 'block';

						break;
					}



					default:
					{
						if (value.includes('vulkan'))
						{
							if (renderer_native)
							{
								renderer_native.endLoop();
								renderer_native.destroy();

								renderer_native.canvas.parentNode.style.display = 'none';
							}

							cancelAnimationFrame(electron_animation_frame);

							terminateRenderingThread();

							const vulkan_physical_device_index = parseInt(value.replace('vulkan', ''), 10);

							runRenderingThread('vulkan', vulkan_physical_device_index);

							await testPixelDataStorageIsAllocatedSync();

							const pixel_data_storage = getPixelDataStorage();

							const { renderer_width, renderer_height } = getRendererSize();

							const canvas = document.querySelector('#offscreen');
							canvas.width = renderer_width;
							canvas.height = renderer_height;
							canvas.style.width = `${ renderer_width }px`;
							canvas.style.height = `${ renderer_height }px`;

							electron_image_data =
								electron_canvas_context.createImageData(renderer_width, renderer_height);

							const render = () =>
							{
								electron_image_data.data.set(pixel_data_storage);

								electron_canvas_context.putImageData(electron_image_data, 0, 0);

								electron_animation_frame = requestAnimationFrame(render);
							};

							render();

							document.querySelector('#offscreen').parentNode.style.display = 'block';
						}
					}
					}
				},
			);



		{
			if (renderer_webgpu)
			{
				useWebgpu();
			}
			else if (renderer_webgl2)
			{
				useWebgl2();
			}
			else
			{
				useWebgl();
			}

			renderer_native.canvas.parentNode.style.display = 'block';

			renderer_native.startLoop();
		}



		// wasm.exports.initTransitionStack();

		// const updateOrbit = () =>
		// {
		// 	// wasm.exports._ZN3RS4MATH5Orbit7rotate2Eff(orbit, 0.01, 0.01);
		// 	// wasm.exports._ZN3RS4MATH5Orbit6updateEv(orbit);

		// 	// wasm.exports._ZN3RS4MATH5Orbit7rotate2Eff(orbit2, 0.01, 0.01);
		// 	// wasm.exports._ZN3RS4MATH5Orbit6updateEv(orbit2);

		// 	// wasm.exports.updateTransitions();

		// 	requestAnimationFrame(updateOrbit);
		// };

		// updateOrbit();

		setTimeout(wasm.exports.startTransition, 3000);
		setTimeout(wasm.exports.startTransition2, 4000);

		// setInterval(wasm.exports.logStacks, 100);
	},
);
