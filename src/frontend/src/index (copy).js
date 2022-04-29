/*
eslint-disable

max-statements,
no-lone-blocks,
no-magic-numbers,
*/



import './index.scss';

import * as dat from 'dat.gui';
import * as THREE from 'three';

import WasmWrapper from '../../../../wasm-wrapper/src/index.js';
import RdtyRenderers from '../../../../renderers-web/src/index.js';

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
		const wasm_wrapper = new WasmWrapper();

		// 4gb == 65536 pages
		const wasm_memory = new WebAssembly.Memory({ initial: 65536, maximum: 65536, shared: true });

		await wasm_wrapper.init(wasm_code, wasm_memory);

		wasm_wrapper.exports.initTransitionStack();
		wasm_wrapper.exports.constructStage1();



		threads.forEach
		((thread, thread_index) => thread.postMessage({ thread_index, wasm_code, wasm_memory }));



		const renderer_addr = wasm_wrapper.Addr(wasm_wrapper.exports.renderer.value);
		const scene_addr = wasm_wrapper.Addr(wasm_wrapper.exports.scene.value);
		const material_addr = wasm_wrapper.Addr(wasm_wrapper.exports.material.value);
		const material2_addr = wasm_wrapper.Addr(wasm_wrapper.exports.material2.value);
		const uniform_block0_addr = wasm_wrapper.Addr(wasm_wrapper.exports.uniform_block0.value);
		const object_addr = wasm_wrapper.Addr(wasm_wrapper.exports._object.value);
		const object2_addr = wasm_wrapper.Addr(wasm_wrapper.exports.object2.value);
		const desc_set1_addr = wasm_wrapper.Addr(wasm_wrapper.exports.desc_set1.value);
		const desc_set2_addr = wasm_wrapper.Addr(wasm_wrapper.exports.desc_set2.value);

		const surface_material_addr = wasm_wrapper.Addr(wasm_wrapper.exports.surface_material.value);
		const surface_object_addr = wasm_wrapper.Addr(wasm_wrapper.exports.surface_object.value);



		{
			const orbit = wasm_wrapper.Addr(wasm_wrapper.exports.orbit.value);
			// const orbit2 = wasm_wrapper.Addr(wasm_wrapper.exports.orbit2.value);

			const RDTY_MATH_Orbit_rotate2 = wasm_wrapper.exports_demangled['RDTY::MATH::Orbit::rotate3(float,float)'];
			const RDTY_MATH_Orbit_update = wasm_wrapper.exports_demangled['RDTY::MATH::Orbit::update()'];

			window.addEventListener
			(
				'mousemove',

				(evt) =>
				{
					RDTY_MATH_Orbit_rotate2(orbit, evt.movementX * 0.01, evt.movementY * 0.01);
					RDTY_MATH_Orbit_update(orbit);


					wasm_wrapper.exports.startTransition();
				},
			);
		}



		const rdty_renderers = new RdtyRenderers(wasm_wrapper);



		/* eslint-disable */
		let tree_data = null;

		{
			const vsub = (target, a, b) =>
			{
				target[0] = a[0] - b[0];
				target[1] = a[1] - b[1];
				target[2] = a[2] - b[2];
			};

			// const vadd = (target, a, b) =>
			// {
			// 	target[0] = a[0] + b[0];
			// 	target[1] = a[1] + b[1];
			// 	target[2] = a[2] + b[2];
			// };

			// const vmuls = (target, s) =>
			// {
			// 	target[0] *= s;
			// 	target[1] *= s;
			// 	target[2] *= s;
			// };

			// const vcross = (target, a, b) =>
			// {
			// 	target[0] = (a[1] * b[2]) - (a[2] * b[1]);
			// 	target[1] = (a[2] * b[0]) - (a[0] * b[2]);
			// 	target[2] = (a[0] * b[1]) - (a[1] * b[0]);
			// };

			// const vdot = (a, b) =>
			// {
			// 	return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
			// };

			// const vdist = (a, b) =>
			// {
			// 	return Math.sqrt(((a[0] - b[0]) * (a[0] - b[0])) + ((a[1] - b[1]) * (a[1] - b[1])) + ((a[2] - b[2]) * (a[2] - b[2])));
			// };

			// const vcopy = (target, src) =>
			// {
			// 	target[0] = src[0];
			// 	target[1] = src[1];
			// 	target[2] = src[2];
			// };

			const testRayBoxIntersection = (ray_origin, ray_direction, box_min, box_max) =>
			{
				let tmin = (box_min[0] - ray_origin[0]) / ray_direction[0];
				let tmax = (box_max[0] - ray_origin[0]) / ray_direction[0];

				if (tmin > tmax)
				{
					const _tmp = tmin;
					tmin = tmax;
					tmax = _tmp;
				}

				let tymin = (box_min[1] - ray_origin[1]) / ray_direction[1];
				let tymax = (box_max[1] - ray_origin[1]) / ray_direction[1];

				if (tymin > tymax)
				{
					const _tmp = tymin;
					tymin = tymax;
					tymax = _tmp;
				}

				if ((tmin > tymax) || (tymin > tmax))
				{
					return false;
				}

				if (tymin > tmin)
				{
					tmin = tymin;
				}

				if (tymax < tmax)
				{
					tmax = tymax;
				}

				let tzmin = (box_min[2] - ray_origin[2]) / ray_direction[2];
				let tzmax = (box_max[2] - ray_origin[2]) / ray_direction[2];

				if (tzmin > tzmax)
				{
					const _tmp = tzmin;
					tzmin = tzmax;
					tzmax = _tmp;
				}

				if ((tmin > tzmax) || (tzmin > tmax))
				{
					return false;
				}

				if (tzmin > tmin)
				{
					tmin = tzmin;
				}

				if (tzmax < tmax)
				{
					tmax = tzmax;
				}

				return ((tmin < 1000) && (tmax > 0));
			};



			const p1 = [ 0, 0, 0 ];
			const p2 = [ 0, 0, 0 ];
			const p3 = [ 0, 0, 0 ];
			const p1p2 = [ 0, 0, 0 ];
			const p1p3 = [ 0, 0, 0 ];
			const p2p1 = [ 0, 0, 0 ];
			const p2p3 = [ 0, 0, 0 ];
			const p3p1 = [ 0, 0, 0 ];
			const p3p2 = [ 0, 0, 0 ];



			class BoxTree
			{
				static level_num = 5;



				constructor (position_data, index_data)
				{
					this.position_data = position_data;
					this.index_data = index_data;

					this.x_min = Infinity;
					this.x_max = -Infinity;
					this.y_min = Infinity;
					this.y_max = -Infinity;
					this.z_min = Infinity;
					this.z_max = -Infinity;

					this.bounding_box = null;



					this._data = new ArrayBuffer(1024 * 1024 * 4);
					this.data_ui32 = new Uint32Array(this._data);
					this.data_f32 = new Float32Array(this._data);



					const _object = this;

					class Box
					{
						static instances = [];



						constructor (center, size)
						{
							this.center = center;
							this.size = size;

							this.min =
							[
								this.center[0] - (this.size * 0.5),
								this.center[1] - (this.size * 0.5),
								this.center[2] - (this.size * 0.5)
							];

							this.max =
							[
								this.center[0] + (this.size * 0.5),
								this.center[1] + (this.size * 0.5),
								this.center[2] + (this.size * 0.5)
							];

							this.boxes = [];
							this.triangles = [];

							Box.instances.push(this);
						}

						testPointInsideBox (point)
						{
							return Boolean
							(
								point[0] <= this.max[0] && point[0] >= this.min[0] &&
								point[1] <= this.max[1] && point[1] >= this.min[1] &&
								point[2] <= this.max[2] && point[2] >= this.min[2],
							);
						}

						split (level)
						{
							if (level === BoxTree.level_num - 1)
							{
								return;
							}



							const child_size = this.size * 0.5;

							const child_center_offset = child_size / 2;

							const child_centers =
							[
								[ this.center[0] + child_center_offset, this.center[1] + child_center_offset, this.center[2] + child_center_offset ],
								[ this.center[0] + child_center_offset, this.center[1] + child_center_offset, this.center[2] - child_center_offset ],
								[ this.center[0] + child_center_offset, this.center[1] - child_center_offset, this.center[2] + child_center_offset ],
								[ this.center[0] + child_center_offset, this.center[1] - child_center_offset, this.center[2] - child_center_offset ],
								[ this.center[0] - child_center_offset, this.center[1] + child_center_offset, this.center[2] + child_center_offset ],
								[ this.center[0] - child_center_offset, this.center[1] + child_center_offset, this.center[2] - child_center_offset ],
								[ this.center[0] - child_center_offset, this.center[1] - child_center_offset, this.center[2] + child_center_offset ],
								[ this.center[0] - child_center_offset, this.center[1] - child_center_offset, this.center[2] - child_center_offset ],
							];

							this.boxes.push(...child_centers.map((center) => new _object.Box(center, child_size, this)));

							this.boxes.forEach((box) => box.split(level + 1));
						}

						pushTriangle (triangle_index, level)
						{
							let boxHasTriangle = false;

							const vertex1_index = _object.index_data[(triangle_index * 3) + 0];
							const vertex2_index = _object.index_data[(triangle_index * 3) + 1];
							const vertex3_index = _object.index_data[(triangle_index * 3) + 2];

							p1[0] = _object.position_data[(vertex1_index * 3) + 0];
							p1[1] = _object.position_data[(vertex1_index * 3) + 1];
							p1[2] = _object.position_data[(vertex1_index * 3) + 2];

							p2[0] = _object.position_data[(vertex2_index * 3) + 0];
							p2[1] = _object.position_data[(vertex2_index * 3) + 1];
							p2[2] = _object.position_data[(vertex2_index * 3) + 2];

							p3[0] = _object.position_data[(vertex3_index * 3) + 0];
							p3[1] = _object.position_data[(vertex3_index * 3) + 1];
							p3[2] = _object.position_data[(vertex3_index * 3) + 2];

							vsub(p1p2, p2, p1);
							vsub(p1p3, p3, p1);

							vsub(p2p1, p1, p2);
							vsub(p2p3, p3, p2);

							vsub(p3p1, p1, p3);
							vsub(p3p2, p2, p3);

							if
							(
								// point inside box
								this.testPointInsideBox(p1) ||
								this.testPointInsideBox(p2) ||
								this.testPointInsideBox(p3) ||

								// edge intersects box
								(testRayBoxIntersection(p1, p1p2, this.min, this.max) && testRayBoxIntersection(p2, p2p1, this.min, this.max)) ||
								(testRayBoxIntersection(p2, p2p3, this.min, this.max) && testRayBoxIntersection(p3, p3p2, this.min, this.max)) ||
								(testRayBoxIntersection(p3, p3p1, this.min, this.max) && testRayBoxIntersection(p1, p1p3, this.min, this.max))
							)
							{
								this.triangles.push(triangle_index);

								boxHasTriangle = true;
							}



							if (level === BoxTree.level_num - 1)
							{
								return;
							}



							if (boxHasTriangle)
							{
								this.boxes.forEach((box) => box.pushTriangle(triangle_index, level + 1));
							}
						}

						serialize (offset)
						{
							let size = 0;

							_object.data_f32[offset + size + 0] = this.min[0];
							_object.data_f32[offset + size + 1] = this.min[1];
							_object.data_f32[offset + size + 2] = this.min[2];

							size += 4;

							_object.data_f32[offset + size + 0] = this.max[0];
							_object.data_f32[offset + size + 1] = this.max[1];
							_object.data_f32[offset + size + 2] = this.max[2];

							size += 4;

							const boxes_with_triangle_count =
								this.boxes.filter((box) => (box.triangles.length !== 0)).length;

							_object.data_ui32[offset + size] = boxes_with_triangle_count;

							++size;

							if (boxes_with_triangle_count)
							{
								const _size = size;

								const boxes_count = this.boxes.length;

								for (let i = 0, _i = 0; i < boxes_count; ++i)
								{
									const box = this.boxes[i];

									if (box.triangles.length !== 0)
									{
										const box_offset = offset + size + boxes_with_triangle_count;

										_object.data_ui32[offset + _size + _i] = box_offset;

										size += box.serialize(box_offset);

										++_i;
									}
								}

								size += boxes_with_triangle_count;
							}
							else if (this.triangles.length !== 0)
							{
								_object.data_ui32[offset + size] = this.triangles.length;

								++size;

								for (let i = 0, i_max = this.triangles.length; i < i_max; ++i)
								{
									_object.data_ui32[offset + size] = this.triangles[i];

									++size;
								}
							}

							return size;
						}
					}

					this.Box = Box;
				}

				makeBoundingBox ()
				{
					for (let i = 0; i < this.position_data.length; i += 3)
					{
						if (this.position_data[i + 0] < this.x_min)
						{
							this.x_min = this.position_data[i + 0];
						}

						if (this.position_data[i + 0] > this.x_max)
						{
							this.x_max = this.position_data[i + 0];
						}

						if (this.position_data[i + 1] < this.y_min)
						{
							this.y_min = this.position_data[i + 1];
						}

						if (this.position_data[i + 1] > this.y_max)
						{
							this.y_max = this.position_data[i + 1];
						}

						if (this.position_data[i + 2] < this.z_min)
						{
							this.z_min = this.position_data[i + 2];
						}

						if (this.position_data[i + 2] > this.z_max)
						{
							this.z_max = this.position_data[i + 2];
						}
					}

					const center =
					[ (this.x_min + this.x_max) * 0.5, (this.y_min + this.y_max) * 0.5, (this.z_min + this.z_max) * 0.5 ];

					const size = Math.max(Math.max(this.x_max - this.x_min, this.y_max - this.y_min), this.z_max - this.z_min);


					this.bounding_box = new this.Box(center, size);

					this.bounding_box.split(0);
				}

				makeTree ()
				{
					for (let i = 0, i_max = this.index_data.length / 3; i < i_max; ++i)
					{
						this.bounding_box.pushTriangle(i, 0);
					}
				}

				serialize ()
				{
					this.bounding_box.serialize(0, 0);
				}
			}



			const sphere = new THREE.SphereGeometry(15, 256, 256);

			const sphere_object = new BoxTree(sphere.attributes.position.array, sphere.index.array);
			sphere_object.makeBoundingBox();
			sphere_object.makeTree();
			sphere_object.serialize();

			tree_data = sphere_object.data_ui32;



			const geom = sphere;

			const object_base = rdty_renderers.ObjectBase.getInstance(object_addr);

			object_base.updateVertexData(geom.attributes.position.array);
			object_base.updateIndexData(geom.index.array);
		}
		/* eslint-enable */
		/*
		eslint-disable

		max-statements,
		no-lone-blocks,
		no-magic-numbers,
		*/



		// const geom = new THREE.SphereGeometry(2, 16, 16);
		// geom.translate(2, 0, 0);

		// // const geom2 = new THREE.SphereGeometry(2, 16, 16);
		// // geom2.translate(-2, 0, 0);
		// // geom2.index.array = geom2.index.array.map((index) => (index + geom.attributes.position.array.length / 3));



		// const object_base = rdty_renderers.ObjectBase.getInstance(object_addr);

		// object_base.updateVertexData(geom.attributes.position.array);
		// object_base.updateIndexData(geom.index.array);

		// const object2_base = rdty_renderers.ObjectBase.getInstance(object2_addr);

		// object2_base.updateVertexData(geom2.attributes.position.array);
		// object2_base.updateIndexData(geom2.index.array);

		// wasm_wrapper.exports_demangled['RDTY::WRAPPERS::Scene::addObject(RDTY::WRAPPERS::Object*)']
		// (scene_addr, object_addr);
		// wasm_wrapper.exports_demangled['RDTY::WRAPPERS::Scene::addObject(RDTY::WRAPPERS::Object*)']
		// (scene_addr, object2_addr);



		wasm_wrapper.exports.constructStage2();



		let renderer_native = null;
		let renderer_webgl = null;
		let renderer_webgl2 = null;
		let renderer_webgpu = null;



		let useWebgl = null;

		{
			const webgl = new rdty_renderers.WebGL(wasm_wrapper);

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



					gl.clearColor(1, 1, 1, 1);

					const b = gl.createBuffer();

					renderer.gpu_resources.push([ 'deleteBuffer', b ]);

					gl.bindBuffer(gl.ARRAY_BUFFER, b);
					gl.bufferData(gl.ARRAY_BUFFER, scene.position_data, gl.STATIC_DRAW);
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
			const webgl = new rdty_renderers.WebGL(wasm_wrapper);

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



					gl.clearColor(1, 1, 1, 1);

					const b = gl.createBuffer();

					renderer.gpu_resources.push([ 'deleteBuffer', b ]);

					gl.bindBuffer(gl.ARRAY_BUFFER, b);
					gl.bufferData(gl.ARRAY_BUFFER, scene.position_data, gl.STATIC_DRAW);
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
			const webgpu = new rdty_renderers.WebGPU(wasm_wrapper);

			const renderer =
				new webgpu.Renderer
				(
					renderer_addr,

					{
						canvas: document.querySelector('#webgpu'),
					},
				);

			const webgpu_adapter = await renderer.init();

			if (renderer.exists && webgpu_adapter)
			{
				renderer_webgpu = renderer;

				gui_options_API.WebGPU = 'webgpu';
				gui_options.API = 'webgpu';



				useWebgpu = () =>
				{
					renderer_native = renderer_webgpu;



					const
						{
							Scene,
							Material,
							UniformBlock,
							StorageBlock2,
							DescriptorSet,
							Object,
						} = renderer;



					const scene = Scene.getInstance(scene_addr);
					const material = Material.getInstance(material_addr, Material.ShaderUsage.GLSL);
					const material2 = Material.getInstance(material2_addr, Material.ShaderUsage.GLSL);
					// const uniform_block0 = UniformBlock.getInstance(uniform_block0_addr);
					const desc_set1 = DescriptorSet.getInstance(desc_set1_addr);
					const desc_set2 = DescriptorSet.getInstance(desc_set2_addr);
					const _object = Object.getInstance(object_addr);
					const object2 = Object.getInstance(object2_addr);

					const surface_uniform_block_camera =
						UniformBlock.getInstance
						(wasm_wrapper.Addr(wasm_wrapper.exports.surface_uniform_block_camera.value));



					const tree_buffer =
						renderer.device.createBuffer
						({
							size: tree_data.byteLength,

							usage:
							(
								window.GPUBufferUsage.COPY_DST |
								window.GPUBufferUsage.STORAGE
							),
						});

					renderer.gpu_resources.push(tree_buffer);

					renderer.device.queue.writeBuffer
					(
						tree_buffer,
						0,
						tree_data,
						0,
						tree_data.length,
					);

					const tree_storage_block =
						new StorageBlock2
						(
							tree_buffer,
							3,
							tree_data.length,
						);

					scene.makeDescriptorSet
					([ tree_storage_block, surface_uniform_block_camera ]);

					const surface_material =
						Material.getInstance
						(surface_material_addr, Material.ShaderUsage.GLSL, [ scene.descriptor_set ]);

					const surface_object = Object.getInstance(surface_object_addr);

					// LOG(surface_uniform_block_camera)

					// LOG(surface_material)

					LOG(object2, scene)



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

						renderer.render_pass_encoder.setVertexBuffer
						(0, scene.position_buffer, 0, scene.original_struct.position_data.byteLength);

						renderer.render_pass_encoder.setIndexBuffer
						(scene.index_buffer, 'uint32', 0, scene.original_struct.index_data.byteLength);

						// desc_set1.use(0);

						// material.use();

						// _object.drawIndexed();

						// desc_set2.use(0);

						// material2.use();

						// object2.drawIndexed();

						scene.descriptor_set.use(0);

						surface_material.use();

						surface_object.draw();

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

		if (window.__CPP_MODULE__)
		{
			{
				const
					{
						_constructRenderityWrappers,
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
						}	= (window.__CPP_MODULE__ || {});

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



		// wasm_wrapper.exports.initTransitionStack();

		// const updateOrbit = () =>
		// {
		// 	// wasm_wrapper.exports._ZN3RS4MATH5Orbit7rotate2Eff(orbit, 0.01, 0.01);
		// 	// wasm_wrapper.exports._ZN3RS4MATH5Orbit6updateEv(orbit);

		// 	// wasm_wrapper.exports._ZN3RS4MATH5Orbit7rotate2Eff(orbit2, 0.01, 0.01);
		// 	// wasm_wrapper.exports._ZN3RS4MATH5Orbit6updateEv(orbit2);

		// 	// wasm_wrapper.exports.updateTransitions();

		// 	requestAnimationFrame(updateOrbit);
		// };

		// updateOrbit();

		// setTimeout(wasm_wrapper.exports.startTransition, 3000);
		// setTimeout(wasm_wrapper.exports.startTransition2, 4000);

		// setInterval(wasm_wrapper.exports.logStacks, 100);
	},
);



// /*
// eslint-disable
// */



// // TODO: variable number of levels depending of triangle count in the box
// import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// LOG(THREE)

// document.body.style.margin = '0px';

// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// camera.position.z = 50;

// const renderer = new THREE.WebGLRenderer();
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);

// // const controls = new OrbitControls( camera, renderer.domElement );
// // controls.update();

// const pointer = new THREE.Mesh(new THREE.SphereGeometry(2, 32, 16), new THREE.MeshBasicMaterial({ wireframe: false, color: 'blue' }));

// scene.add(pointer);

// let 		nearest_ray_triangle_intersection = Infinity;

// // const owned_triangles = [];

// const rc = new THREE.Raycaster();

// const intersection = [ 0, 0, 0 ];
// const intersection_box = [ 0, 0, 0 ];
// // let tri_index = -1;

// // let zxc = 0;



// const testRayBoxIntersection = (ray_origin, ray_direction, box_min, box_max) =>
// {
// 	let tmin = (box_min[0] - ray_origin[0]) / ray_direction[0];
// 	let tmax = (box_max[0] - ray_origin[0]) / ray_direction[0];

// 	if (tmin > tmax)
// 	{
// 		const _tmp = tmin;
// 		tmin = tmax;
// 		tmax = _tmp;
// 	}

// 	let tymin = (box_min[1] - ray_origin[1]) / ray_direction[1];
// 	let tymax = (box_max[1] - ray_origin[1]) / ray_direction[1];

// 	if (tymin > tymax)
// 	{
// 		const _tmp = tymin;
// 		tymin = tymax;
// 		tymax = _tmp;
// 	}

// 	if ((tmin > tymax) || (tymin > tmax))
// 	{
// 		return false;
// 	}

// 	if (tymin > tmin)
// 	{
// 		tmin = tymin;
// 	}

// 	if (tymax < tmax)
// 	{
// 		tmax = tymax;
// 	}

// 	let tzmin = (box_min[2] - ray_origin[2]) / ray_direction[2];
// 	let tzmax = (box_max[2] - ray_origin[2]) / ray_direction[2];

// 	if (tzmin > tzmax)
// 	{
// 		const _tmp = tzmin;
// 		tzmin = tzmax;
// 		tzmax = _tmp;
// 	}

// 	if ((tmin > tzmax) || (tzmin > tmax))
// 	{
// 		return false;
// 	}

// 	if (tzmin > tmin)
// 	{
// 		tmin = tzmin;
// 	}

// 	if (tzmax < tmax)
// 	{
// 		tmax = tzmax;
// 	}

// 	return ((tmin < 1000) && (tmax > 0));
// };

// const _v1 = [ 0, 0, 0 ];
// const _v2 = [ 0, 0, 0 ];
// const _v3 = [ 0, 0, 0 ];
// const _v4 = [ 0, 0, 0 ];
// const _normal = [ 0, 0, 0 ];

// const vsub = (target, a, b) =>
// {
// 	target[0] = a[0] - b[0];
// 	target[1] = a[1] - b[1];
// 	target[2] = a[2] - b[2];
// };

// const vadd = (target, a, b) =>
// {
// 	target[0] = a[0] + b[0];
// 	target[1] = a[1] + b[1];
// 	target[2] = a[2] + b[2];
// };

// const vmuls = (target, s) =>
// {
// 	target[0] *= s;
// 	target[1] *= s;
// 	target[2] *= s;
// };

// const vcross = (target, a, b) =>
// {
// 	target[0] = (a[1] * b[2]) - (a[2] * b[1]);
// 	target[1] = (a[2] * b[0]) - (a[0] * b[2]);
// 	target[2] = (a[0] * b[1]) - (a[1] * b[0]);
// };

// const vdot = (a, b) =>
// {
// 	return (a[0] * b[0]) + (a[1] * b[1]) + (a[2] * b[2]);
// };

// const vdist = (a, b) =>
// {
// 	return Math.sqrt(((a[0] - b[0]) * (a[0] - b[0])) + ((a[1] - b[1]) * (a[1] - b[1])) + ((a[2] - b[2]) * (a[2] - b[2])));
// };

// const vcopy = (target, src) =>
// {
// 	target[0] = src[0];
// 	target[1] = src[1];
// 	target[2] = src[2];
// };

// const getRayBoxIntersection = (ray_origin, ray_direction, box_min, box_max, target) =>
// {
// 	let tmin = (box_min[0] - ray_origin[0]) / ray_direction[0];
// 	let tmax = (box_max[0] - ray_origin[0]) / ray_direction[0];

// 	if (tmin > tmax)
// 	{
// 		const _tmp = tmin;
// 		tmin = tmax;
// 		tmax = _tmp;
// 	}

// 	let tymin = (box_min[1] - ray_origin[1]) / ray_direction[1];
// 	let tymax = (box_max[1] - ray_origin[1]) / ray_direction[1];

// 	if (tymin > tymax)
// 	{
// 		const _tmp = tymin;
// 		tymin = tymax;
// 		tymax = _tmp;
// 	}

// 	if ((tmin > tymax) || (tymin > tmax))
// 	{
// 		return null;
// 	}

// 	if (tymin > tmin)
// 	{
// 		tmin = tymin;
// 	}

// 	if (tymax < tmax)
// 	{
// 		tmax = tymax;
// 	}

// 	let tzmin = (box_min[2] - ray_origin[2]) / ray_direction[2];
// 	let tzmax = (box_max[2] - ray_origin[2]) / ray_direction[2];

// 	if (tzmin > tzmax)
// 	{
// 		const _tmp = tzmin;
// 		tzmin = tzmax;
// 		tzmax = _tmp;
// 	}

// 	if ((tmin > tzmax) || (tzmin > tmax))
// 	{
// 		return null;
// 	}

// 	if (tzmin > tmin)
// 	{
// 		tmin = tzmin;
// 	}

// 	if (tzmax < tmax)
// 	{
// 		tmax = tzmax;
// 	}

// 	vcopy(target, ray_direction);
// 	vmuls(target, tmin >= 0 ? tmin : tmax);
// 	vadd(target, target, ray_origin);

// 	return target;
// };

// const getRayTriangleIntersection = (ray_origin, ray_direction, a, b, c, backfaceCulling, target) =>
// {
// 	// Compute the offset origin, edges, and normal.

// 	// from https://github.com/pmjoniak/GeometricTools/blob/master/GTEngine/Include/Mathematics/GteIntrRay3Triangle3.h

// 	// _v1.subVectors(b, a);
// 	// _v2.subVectors(c, a);
// 	// _normal.crossVectors(_v1, _v2);

// 	vsub(_v1, b, a);
// 	vsub(_v2, c, a);
// 	vcross(_normal, _v1, _v2);

// 	// Solve Q + t*D = b1*E1 + b2*E2 (Q = kDiff, D = ray direction,
// 	// E1 = kEdge1, E2 = kEdge2, N = Cross(E1,E2)) by
// 	//   |Dot(D,N)|*b1 = sign(Dot(D,N))*Dot(D,Cross(Q,E2))
// 	//   |Dot(D,N)|*b2 = sign(Dot(D,N))*Dot(D,Cross(E1,Q))
// 	//   |Dot(D,N)|*t = -sign(Dot(D,N))*Dot(Q,N)
// 	// let DdN = ray_direction.dot(_normal);
// 	let DdN = vdot(ray_direction, _normal);
// 	let sign = 0;

// 	if (DdN > 0)
// 	{
// 		if (backfaceCulling) return false;
// 		sign = 1;
// 	}
// 	else if (DdN < 0)
// 	{
// 		sign = - 1;
// 		DdN = - DdN;
// 	}
// 	else
// 	{
// 		return false;
// 	}

// 	// _v3.subVectors(this.origin, a);
// 	vsub(_v3, ray_origin, a);
// 	// const DdQxE2 = sign * ray_direction.dot(_v2.crossVectors(_v3, _v2));
// 	vcross(_v4, _v3, _v2)
// 	const DdQxE2 = sign * vdot(ray_direction, _v4);

// 	// b1 < 0, no intersection
// 	if (DdQxE2 < 0)
// 	{
// 		return false;
// 	}

// 	// const DdE1xQ = sign * ray_direction.dot(_v1.cross(_v3));
// 	vcross(_v4, _v1, _v3)
// 	const DdE1xQ = sign * vdot(ray_direction, _v4);

// 	// b2 < 0, no intersection
// 	if (DdE1xQ < 0)
// 	{
// 		return false;
// 	}

// 	// b1+b2 > 1, no intersection
// 	if (DdQxE2 + DdE1xQ > DdN)
// 	{
// 		return false;
// 	}

// 	// Line intersects triangle, check if ray does.
// 	// const QdN = - sign * _v3.dot(_normal);
// 	const QdN = - sign * vdot(_v3, _normal);

// 	// t < 0, no intersection
// 	if (QdN < 0)
// 	{
// 		return false;
// 	}

// 	// Ray intersects triangle.
// 	vcopy(target, ray_direction);
// 	vmuls(target, QdN / DdN);
// 	vadd(target, target, ray_origin);

// 	return true;
// };



// const p1 = [ 0, 0, 0 ];
// const p2 = [ 0, 0, 0 ];
// const p3 = [ 0, 0, 0 ];
// const p1p2 = [ 0, 0, 0 ];
// const p1p3 = [ 0, 0, 0 ];
// const p2p1 = [ 0, 0, 0 ];
// const p2p3 = [ 0, 0, 0 ];
// const p3p1 = [ 0, 0, 0 ];
// const p3p2 = [ 0, 0, 0 ];







// const sphere = new THREE.SphereGeometry(15, 256, 256);
// // const sphere = new THREE.SphereGeometry(15, 32, 32);
// // const sphere = new THREE.TorusKnotGeometry(10, 3, 300, 20);
// // const sphere = new THREE.ConeGeometry(5, 20, 32);

// const sphere_obj = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ wireframe: true, color: 'red' }));

// scene.add(sphere_obj);

// const sphere_object = new BoxTree(sphere.attributes.position.array, sphere.index.array);
// sphere_object.makeBoundingBox();
// sphere_object.makeTree();

// // sphere_object.Box.instances
// // 	.filter((box) => (box.boxes.length !== 0))
// // 	.forEach
// // 	(
// // 		(box) =>
// // 		{
// // 			box.boxes = box.boxes.sort((a, b) => (b.triangles.length - a.triangles.length));
// // 		},
// // 	);

// sphere_object.Box.instances
// 	.filter((box) => box.triangles.length !== 0)
// 	.forEach
// 	(
// 		(box) =>
// 		{

// 			const three_obj = new THREE.Mesh(new THREE.BoxGeometry(box.size, box.size, box.size, 1), new THREE.MeshBasicMaterial({ wireframe: true }));
// 			// const three_obj = new THREE.Mesh(new THREE.BoxGeometry(box.size, box.size, box.size, 1), new THREE.MeshBasicMaterial({ wireframe: false }));

// 			three_obj.position.set(...box.center);

// 			scene.add(three_obj);
// 		},
// 	);

// sphere_object.serialize();



// LOG(sphere_object)
// const mouse = new THREE.Vector2();

// const ray_origin = [ 0, 0, 0 ];
// const ray_direction = [ 0, 0, 0 ];

// // LOG(sphere_obj.matrix.elements)
// sphere_obj.rotation.x += Math.PI * 0.5;
// // sphere_obj.position.z += -50;
// // sphere_obj.updateMatrix();
// // LOG(sphere_obj.matrix.elements)

// // camera.rotation.x -= Math.PI * 0.1;
// // camera.lookAt(new THREE.Vector3());

// camera.matrixAutoUpdate = false;

// camera.matrixWorld
// 	.multiply(new THREE.Matrix4().makeTranslation(0, 0, 50));
// // 	.premultiply(new THREE.Matrix4().makeRotationX(-Math.PI * 0.5));

// window.addEventListener
// (
// 	'mousemove',

// 	(evt) =>
// 	{
// 		mouse.x = ((evt.clientX / window.innerWidth) * 2) - 1;
// 		mouse.y = (-(evt.clientY / window.innerHeight) * 2) + 1;



// 		const mmm = camera.matrixWorld.clone();

// 		camera.matrixWorld.premultiply(sphere_obj.matrixWorld.clone().invert());

// 		// LOG(camera.matrixWorld.elements);

// 		rc.setFromCamera(mouse, camera);

// 		camera.matrixWorld.copy(mmm);



// 		ray_origin[0] = rc.ray.origin.x;
// 		ray_origin[1] = rc.ray.origin.y;
// 		ray_origin[2] = rc.ray.origin.z;

// 		ray_direction[0] = rc.ray.direction.x;
// 		ray_direction[1] = rc.ray.direction.y;
// 		ray_direction[2] = rc.ray.direction.z;

// 		// sphere_object.bounding_box.search(ray_origin, ray_direction, 0);
// 		// const t = Date.now();
// 		// for (let i = 0; i < 256; ++i)
// 		// {
// 			nearest_ray_triangle_intersection = Infinity;
// 			vcopy(intersection, ray_origin);
// 			// sphere_object.search(ray_origin, ray_direction, 0);



// 			// LOG(BoxTree.level_num)
// 			let current_level = 0;
// 			const box_sizes = new Uint32Array(BoxTree.level_num + 1);
// 			const box_counters = new Uint32Array(BoxTree.level_num + 1);
// 			const box_offsets = new Uint32Array((BoxTree.level_num + 1) * 8);

// 			box_sizes[0] = 1;

// 			// let max_level = -Infinity;

// 			let box_offset = 0;

// 			for (;;)
// 			{
// 				++box_counters[current_level];

// 				const box_min = sphere_object.data_f32.subarray(box_offset, box_offset + 3);
// 				const box_max = sphere_object.data_f32.subarray(box_offset + 4, box_offset + 7);

// 				if
// 				(
// 					getRayBoxIntersection(ray_origin, ray_direction, box_min, box_max, intersection_box) &&
// 					vdist(ray_origin, intersection_box) < nearest_ray_triangle_intersection
// 				)
// 				{
// 					const box_count = sphere_object.data_ui32[box_offset + 8];

// 					if (box_count === 0)
// 					{
// 						const triangle_count = sphere_object.data_ui32[box_offset + 9];

// 						const triangles = sphere_object.data_ui32.subarray(box_offset + 10, box_offset + 10 + triangle_count);

// 						for (let i = 0; i < triangle_count; ++i)
// 						{
// 							const triangle_index = triangles[i];

// 							const triangle_first_point_index = triangle_index * 3;

// 							const vertex1_index = sphere_object.index_data[triangle_first_point_index];
// 							const vertex2_index = sphere_object.index_data[triangle_first_point_index + 1];
// 							const vertex3_index = sphere_object.index_data[triangle_first_point_index + 2];

// 							const vertex1_x_coord_index = vertex1_index * 3;
// 							const vertex2_x_coord_index = vertex2_index * 3;
// 							const vertex3_x_coord_index = vertex3_index * 3;

// 							p1[0] = sphere_object.position_data[vertex1_x_coord_index];
// 							p1[1] = sphere_object.position_data[vertex1_x_coord_index + 1];
// 							p1[2] = sphere_object.position_data[vertex1_x_coord_index + 2];

// 							p2[0] = sphere_object.position_data[vertex2_x_coord_index];
// 							p2[1] = sphere_object.position_data[vertex2_x_coord_index + 1];
// 							p2[2] = sphere_object.position_data[vertex2_x_coord_index + 2];

// 							p3[0] = sphere_object.position_data[vertex3_x_coord_index];
// 							p3[1] = sphere_object.position_data[vertex3_x_coord_index + 1];
// 							p3[2] = sphere_object.position_data[vertex3_x_coord_index + 2];

// 							if (!getRayTriangleIntersection(ray_origin, ray_direction, p1, p2, p3, false, intersection))
// 							{
// 								continue;
// 							}

// 							const ray_origin_to_intersection_distance = vdist(ray_origin, intersection);

// 							if (ray_origin_to_intersection_distance < nearest_ray_triangle_intersection && ray_origin_to_intersection_distance > 0.001)
// 							{
// 								nearest_ray_triangle_intersection = ray_origin_to_intersection_distance;
// 							}
// 						}
// 					}

// 					if (box_counters[current_level] > box_sizes[current_level])
// 					{
// 						--current_level;

// 						if (current_level === 0)
// 						{
// 							break;
// 						}
// 					}
// 					else
// 					{
// 						++current_level;

// 						for (let i = 0; i < box_count; ++i)
// 						{
// 							box_offsets[(current_level * 8) + i] = sphere_object.data_ui32[box_offset + 9 + i];
// 						}

// 						box_sizes[current_level] = box_count;
// 						box_counters[current_level] = 0;
// 					}

// 					box_offset = box_offsets[(current_level * 8) + box_counters[current_level]];

// 					continue;
// 				}

// 				if (current_level === 0)
// 				{
// 					break;
// 				}

// 				if (box_counters[current_level] > box_sizes[current_level])
// 				{
// 					--current_level;

// 					// Remove ?
// 					if (current_level === 0)
// 					{
// 						break;
// 					}
// 				}

// 				box_offset = box_offsets[(current_level * 8) + box_counters[current_level]];
// 			}



// 			pointer.position.set(...intersection);
// 			pointer.position.applyMatrix4(sphere_obj.matrixWorld);

// 			renderer.render(scene, camera);

// 			// LOG('max_level', max_level)
// 		// }
// 		// LOG(Date.now() - t)
// 	},
// );

// LOG('Ready');

// // const animate = () =>
// // {
// // 	requestAnimationFrame(animate);
// // 	// controls.update();
// // 	// sphere_obj.rotation.x += 0.01;
// // 	renderer.render(scene, camera);
// // };

// // animate();
