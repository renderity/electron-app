/*
eslint-disable

max-statements,
no-lone-blocks,
no-magic-numbers,
*/



import './index.scss';

import * as THREE from 'three';
import { mergeVertices } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import { OBJLoader } from 'three/examples/jsm/loaders/OBJLoader.js';

import WasmWrapper from '../../../../wasm-wrapper/src/index.js';
import RenderersWeb from '../../../../renderers-web/src/index.js';

// import wasm_code from '../../../../cpp-webpack-loader/index.js!./cpp/src/entry-wasm32.cpp';
import wasm_code from './cpp/entry-wasm32.cpp.json';



const obj_loader = new OBJLoader();



window.addEventListener
(
	'load',

	async () =>
	{
		const wasm =
			new WasmWrapper
			({
				usePreallocatedThreadStack: true,
				// window.navigator.hardwareConcurrency
				thread_count: 4,
				thread_stack_size: 1024 * 1024,
			});

		await wasm.init(wasm_code);



		wasm.exports.initTransitionStack();
		wasm.exports.constructStage1();



		const renderers_web = new RenderersWeb(wasm);



		[
			{
				name: '_object',
				// geometry: new THREE.SphereGeometry(10, 64, 64),
				// geometry: new THREE.OctahedronGeometry(10, 32),

				geometry:
				(
					await new Promise
					(
						resolve =>
						{
							obj_loader.load
							(
								'public/d4a9_scan_crown.obj',

								_object => resolve(mergeVertices(_object.children[0].geometry).center()),
							);
						},
					)
				),

				position: [ -10, -10, 0 ],
			},

			{
				name: 'object2',
				geometry: new THREE.TorusGeometry(5, 1.5, 160, 32),
				position: [ -10, 10, 0 ],
			},

			{
				name: 'object3',
				geometry: new THREE.TorusKnotGeometry(5, 1.5, 160, 32),
				position: [ 10, -10, 0 ],
			},

			{
				name: 'object4',
				geometry: new THREE.BoxGeometry(20, 20, 20, 32, 32, 32),
				// geometry: new THREE.PlaneGeometry(20, 20, 32, 32).rotateX(Math.PI * 0.25),
				position: [ 10, 10, 0 ],
			},
		]
			// .slice(0, 3)
			.forEach
			(
				(desc, desc_index) =>
				{
					desc.geometry.translate(...desc.position);

					const obj = renderers_web.ObjectBase.getInstance2(desc.name);

					const _pos = new Float32Array(desc.geometry.attributes.position.array.length / 3 * 4);
					const _pos_uint = new Uint32Array(_pos.buffer);

					for (let i = 0; i < desc.geometry.attributes.position.array.length / 3; ++i)
					{
						_pos.set(desc.geometry.attributes.position.array.subarray(i * 3, (i * 3) + 4), i * 4);

						_pos_uint[(i * 4) + 3] = desc_index;
					}

					const _norm = new Float32Array(_pos.length);

					for (let i = 0; i < desc.geometry.attributes.normal.array.length / 3; ++i)
					{
						_norm.set(desc.geometry.attributes.normal.array.subarray(i * 3, (i * 3) + 4), i * 4);
					}

					const _ind = new Uint32Array(desc.geometry.index.array.length / 3 * 4);

					for (let i = 0; i < desc.geometry.index.array.length / 3; ++i)
					{
						_ind.set(desc.geometry.index.array.subarray(i * 3, (i * 3) + 4), i * 4);
					}

					obj.updateStdVectorData('position_data', 'Float', _pos);
					obj.updateStdVectorData('normal_data', 'Float', _norm);
					obj.updateStdVectorData('index_data', 'Uint32', _ind);

					// if (desc_index === 2)
					// {
					// 	LOG
					// 	(
					// 		`
					// 			#include <cstdint>



					// 			struct O${ desc_index + 1 }
					// 			{
					// 				const float position_data [${ _pos.length }] { ${ Array.prototype.slice.call(_pos) } };
					// 				const float normal_data [${ _norm.length }] { ${ Array.prototype.slice.call(_norm) } };
					// 				const uint32_t index_data [${ _ind.length }] { ${ Array.prototype.slice.call(_ind) } };
					// 			};
					// 		`,
					// 	);
					// }
				},
			);



		// wasm.exports.updateObjectsData();
		wasm.exports.constructStage2();



		// const stack_addr = wasm.exports.RDTY_WASM_WRAPPER_malloc(1024 * 1024 * 4);

		const t = Date.now();

		// wasm.exports.generateBoxes(wasm.Addr2('_object')[0]);
		// wasm.exports.generateBoxes(wasm.Addr2('object2')[0]);
		// wasm.exports.generateBoxes(wasm.Addr2('object3')[0]);
		// wasm.exports.generateBoxes(wasm.Addr2('object4')[0]);

		// await new wasm.Thread('generateBoxes', [ wasm.Addr2('_object')[0] ]).join();
		// await new wasm.Thread('generateBoxes', [ wasm.Addr2('object2')[0] ]).join();
		// await new wasm.Thread('generateBoxes', [ wasm.Addr2('object3')[0] ]).join();
		// await new wasm.Thread('generateBoxes', [ wasm.Addr2('object4')[0] ]).join();

		// const thr1 = new wasm.Thread('generateBoxes', [ wasm.Addr2('_object')[0] ], stack_addr);
		// const thr2 = new wasm.Thread('generateBoxes', [ wasm.Addr2('object2')[0] ], stack_addr + (1024 * 1024 * 1));
		// const thr3 = new wasm.Thread('generateBoxes', [ wasm.Addr2('object3')[0] ], stack_addr + (1024 * 1024 * 2));
		// const thr4 = new wasm.Thread('generateBoxes', [ wasm.Addr2('object4')[0] ], stack_addr + (1024 * 1024 * 3));

		const thr1 = new wasm.Thread('generateBoxes', [ wasm.Addr2('_object')[0] ]);
		const thr2 = new wasm.Thread('generateBoxes', [ wasm.Addr2('object2')[0] ]);
		const thr3 = new wasm.Thread('generateBoxes', [ wasm.Addr2('object3')[0] ]);
		const thr4 = new wasm.Thread('generateBoxes', [ wasm.Addr2('object4')[0] ]);

		await thr1.join();
		await thr2.join();
		await thr3.join();
		await thr4.join();

		LOG(Date.now() - t)

		// wasm.exports.RDTY_WASM_WRAPPER_free(stack_addr);



		wasm.exports.constructStage3();



		new wasm.Thread('updateTransitions', [ wasm.Addr2('_stack0')[0] ], null, true);
		new wasm.Thread('updateTransitions', [ wasm.Addr2('_stack1')[0] ], null, true);



		{
			const Orbit = wasm.Class('RDTY::MATH::Orbit');

			const orbit = new Orbit('orbit');

			window.addEventListener
			(
				'mousemove',

				(evt) =>
				{
					// orbit.rotate3(evt.movementY * 0.01, evt.movementX * 0.01);
					// orbit.update();

					// LOG(evt.movementY * 0.01, evt.movementX * 0.01)

					wasm.exports.startTransition(evt.movementY * 0.001, evt.movementX * 0.001);
				},
			);

			window.addEventListener
			(
				'wheel',

				(evt) =>
				{
					evt.preventDefault();

					const sign = (evt.deltaY || evt.detail || evt.wheelDelta) * 0.1;

					orbit.transZ3(sign);
					orbit.update();
				},
			);

			document.querySelector('#webgpu').addEventListener
			(
				'wheel',

				evt => evt.preventDefault(),
			);
		}



		const webgpu = new renderers_web.WebGPU(wasm);

		const renderer =
			new webgpu.Renderer
			(
				'renderer',

				{
					canvas: document.querySelector('#webgpu'),
				},
			);

		await renderer.init();

		renderer.appendFpsCounter();



		const
			{
				Material,
				DescriptorSet,
				Object,
			} = renderer;



		const descriptor_set_scene = DescriptorSet.getInstance2('descriptor_set_scene');

		const surface_material =
			Material.getInstance2('surface_material', Material.ShaderUsage.GLSL);

		const surface_object = Object.getInstance2('surface_object');

		surface_object.createBuffers();



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

							clearValue: [ 1, 1, 1, 1 ],
							loadOp: 'clear',
							storeOp: 'store',
						},
					],
				});

			renderer.render_pass_encoder.setVertexBuffer
			(0, surface_object.position_buffer, 0, surface_object.original_struct.position_data.byteLength);

			descriptor_set_scene.use(0);

			surface_material.use();

			surface_object.draw2();

			renderer.render_pass_encoder.end();

			const command_buffer = command_encoder.finish();

			renderer.device.queue.submit([ command_buffer ]);

			renderer.updateFpsCounter();
		};

		renderer.canvas.parentNode.style.display = 'block';

		renderer.startLoop();
	},
);




// /*
// eslint-disable
// */



// // TODO: variable number of levels depending of triangle count in the box
// import * as THREE from 'three';
// import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';

// document.body.style.margin = '0px';

// const scene = new THREE.Scene();
// const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

// const renderer = new THREE.WebGLRenderer();
// renderer.setSize(window.innerWidth, window.innerHeight);
// document.body.appendChild(renderer.domElement);

// const controls = new OrbitControls(camera, renderer.domElement);

// camera.position.z = 50;

// controls.update();

// const sphere = new THREE.SphereGeometry(15, 64, 64);
// // const sphere = new THREE.TorusGeometry(15, 3, 200, 16);
// // const sphere = new THREE.TorusKnotGeometry(10, 3, 80, 16);
// sphere.translate(2, 0, 0);

// const pointer = new THREE.Mesh(new THREE.SphereGeometry(2, 32, 16), new THREE.MeshBasicMaterial({ wireframe: false, color: 'blue' }));

// const dimension_segment_count = 16;
// const pointer2 = new THREE.Mesh(new THREE.BoxGeometry(30 / dimension_segment_count, 30 / dimension_segment_count, 30 / dimension_segment_count), new THREE.MeshBasicMaterial({ wireframe: false, color: 'blue' }));

// scene.add(pointer);
// scene.add(pointer2);

// let nearest_ray_triangle_intersection = Infinity;

// const rc = new THREE.Raycaster();

// const intersection = [ 0, 0, 0 ];
// const intersection_box = [ 0, 0, 0 ];
// const intersection_box_far = [ 0, 0, 0 ];
// const intersection_box_far1 = [ 0, 0, 0 ];



// const testRayBoxIntersection2 = (ray_origin, ray_direction, box_min, box_max) =>
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

// 	if (tymin > tmin || tmin !== tmin)
// 	{
// 		tmin = tymin;
// 	}

// 	if (tymax < tmax || tmax !== tmax)
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

// 	if (tzmin > tmin || tmin !== tmin)
// 	{
// 		tmin = tzmin;
// 	}

// 	if (tzmax < tmax || tmax !== tmax)
// 	{
// 		tmax = tzmax;
// 	}

// 	if (tmin > tmax)
// 	{
// 		return false;
// 	}

// 	return true;
// };

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

// 	if (tmin > tmax)
// 	{
// 		return false;
// 	}

// 	return (tmin > 0 && tmax > 0);
// 	// return true;
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

// const vdist2 = (a, b) =>
// {
// 	return ((a[0] - b[0]) * (a[0] - b[0])) + ((a[1] - b[1]) * (a[1] - b[1])) + ((a[2] - b[2]) * (a[2] - b[2]));
// };

// const vcopy = (target, src) =>
// {
// 	target[0] = src[0];
// 	target[1] = src[1];
// 	target[2] = src[2];
// };

// const getRayBoxIntersection = (ray_origin, ray_direction, box_min, box_max, target, target_far) =>
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

// 	if (tymin > tmin || tmin !== tmin)
// 	{
// 		tmin = tymin;
// 	}

// 	if (tymax < tmax || tmax !== tmax)
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

// 	if (tzmin > tmin || tmin !== tmin)
// 	{
// 		tmin = tzmin;
// 	}

// 	if (tzmax < tmax || tmax !== tmax)
// 	{
// 		tmax = tzmax;
// 	}

// 	if (tmin > tmax)
// 	{
// 		return false;
// 	}

// 	if (tmin > 0 && tmax > 0)
// 	{
// 		vcopy(target, ray_direction);
// 		vmuls(target, tmin);
// 		vadd(target, target, ray_origin);

// 		vcopy(target_far, ray_direction);
// 		vmuls(target_far, tmax);
// 		vadd(target_far, target_far, ray_origin);

// 		return true;
// 	}

// 	return true;
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



// const testPointInsideBox = (point, min, max) =>
// {
// 	return Boolean
// 	(
// 		point[0] <= max[0] && point[0] >= min[0] &&
// 		point[1] <= max[1] && point[1] >= min[1] &&
// 		point[2] <= max[2] && point[2] >= min[2],
// 	);
// }

// const testTriangle = (triangle_index, min, max, _object) =>
// {
// 	const vertex1_index = _object.index_data[(triangle_index) + 0];
// 	const vertex2_index = _object.index_data[(triangle_index) + 1];
// 	const vertex3_index = _object.index_data[(triangle_index) + 2];

// 	p1[0] = _object.position_data[(vertex1_index * 3) + 0];
// 	p1[1] = _object.position_data[(vertex1_index * 3) + 1];
// 	p1[2] = _object.position_data[(vertex1_index * 3) + 2];

// 	p2[0] = _object.position_data[(vertex2_index * 3) + 0];
// 	p2[1] = _object.position_data[(vertex2_index * 3) + 1];
// 	p2[2] = _object.position_data[(vertex2_index * 3) + 2];

// 	p3[0] = _object.position_data[(vertex3_index * 3) + 0];
// 	p3[1] = _object.position_data[(vertex3_index * 3) + 1];
// 	p3[2] = _object.position_data[(vertex3_index * 3) + 2];

// 	vsub(p1p2, p2, p1);
// 	vsub(p1p3, p3, p1);

// 	vsub(p2p1, p1, p2);
// 	vsub(p2p3, p3, p2);

// 	vsub(p3p1, p1, p3);
// 	vsub(p3p2, p2, p3);

// 	if
// 	(
// 		// point inside box
// 		testPointInsideBox(p1, min, max) ||
// 		testPointInsideBox(p2, min, max) ||
// 		testPointInsideBox(p3, min, max) ||

// 		// edge intersects box
// 		(testRayBoxIntersection(p1, p1p2, min, max) && testRayBoxIntersection(p2, p2p1, min, max)) ||
// 		(testRayBoxIntersection(p2, p2p3, min, max) && testRayBoxIntersection(p3, p3p2, min, max)) ||
// 		(testRayBoxIntersection(p3, p3p1, min, max) && testRayBoxIntersection(p1, p1p3, min, max))
// 	)
// 	{
// 		return true;
// 	}

// 	return false;
// }



// class BoxTree
// {
// 	constructor (position_data, index_data)
// 	{
// 		this.position_data = position_data;
// 		this.index_data = index_data;

// 		this.min = null;
// 		this.max = null;

// 		this._data = new ArrayBuffer(1048 * 1024 * 4);
// 		this.data_ui32 = new Uint32Array(this._data);
// 		this.data_f32 = new Float32Array(this._data);

// 		this.triangles_data = new Uint32Array(1024 * 1024);
// 		this.triangle_count = 0;
// 	}

// 	makeBoundingBox ()
// 	{
// 		const min = new Float32Array(3);
// 		min[0] = Infinity;
// 		min[1] = Infinity;
// 		min[2] = Infinity;

// 		const max = new Float32Array(3);
// 		max[0] = -Infinity;
// 		max[1] = -Infinity;
// 		max[2] = -Infinity;

// 		for (let i = 0; i < this.position_data.length; i += 3)
// 		{
// 			if (this.position_data[i + 0] < min[0])
// 			{
// 				min[0] = this.position_data[i + 0];
// 			}

// 			if (this.position_data[i + 0] > max[0])
// 			{
// 				max[0] = this.position_data[i + 0];
// 			}

// 			if (this.position_data[i + 1] < min[1])
// 			{
// 				min[1] = this.position_data[i + 1];
// 			}

// 			if (this.position_data[i + 1] > max[1])
// 			{
// 				max[1] = this.position_data[i + 1];
// 			}

// 			if (this.position_data[i + 2] < min[2])
// 			{
// 				min[2] = this.position_data[i + 2];
// 			}

// 			if (this.position_data[i + 2] > max[2])
// 			{
// 				max[2] = this.position_data[i + 2];
// 			}
// 		}

// 		const center =
// 			new Float32Array
// 			([
// 				(min[0] + max[0]) * 0.5,
// 				(min[1] + max[1]) * 0.5,
// 				(min[2] + max[2]) * 0.5,
// 			]);

// 		LOG('center', ...center)

// 		const _min = Math.max(Math.max(Math.abs(min[0] - center[0]), Math.abs(min[1] - center[1])), Math.abs(min[2] - center[2]));
// 		const _max = Math.max(Math.max(Math.abs(max[0] - center[0]), Math.abs(max[1] - center[1])), Math.abs(max[2] - center[2]));
// 		const __max = Math.max(_min, _max);

// 		// min.fill(-__max);
// 		// max.fill(__max);

// 		LOG(_min, _max)

// 		min[0] = center[0] - __max;
// 		min[1] = center[1] - __max;
// 		min[2] = center[2] - __max;

// 		max[0] = center[0] + __max;
// 		max[1] = center[1] + __max;
// 		max[2] = center[2] + __max;

// 		this.min = min;
// 		this.max = max;
// 	}

// 	test ()
// 	{
// 		// let tmin = Infinity;
// 		// let tmax = -Infinity;

// 		const min = new Float32Array(3);
// 		const max = new Float32Array(3);

// 		const step = (this.max[0] - this.min[0]) / dimension_segment_count;

// 		let box_index = 0;

// 		for (let x = 0; x < dimension_segment_count; ++x)
// 		{
// 			for (let y = 0; y < dimension_segment_count; ++y)
// 			{
// 				for (let z = 0; z < dimension_segment_count; ++z)
// 				{
// 					box_index = (x * dimension_segment_count * dimension_segment_count + y * dimension_segment_count + z) * 8;

// 					min[0] = this.min[0] + (step * x);
// 					min[1] = this.min[1] + (step * y);
// 					min[2] = this.min[2] + (step * z);

// 					max[0] = min[0] + step;
// 					max[1] = min[1] + step;
// 					max[2] = min[2] + step;



// 					const triangle_start = this.triangle_count;

// 					for (let i = 0, i_max = this.index_data.length; i < i_max; i += 3)
// 					{
// 						if (testTriangle(i, min, max, this))
// 						{
// 							this.triangles_data[this.triangle_count++] = i;
// 						}
// 					}

// 					const triangle_end = this.triangle_count;

// 					// if (triangle_end - triangle_start > tmax)
// 					// {
// 					// 	tmax = triangle_end - triangle_start;
// 					// }

// 					// if (triangle_end - triangle_start < tmin && triangle_end - triangle_start !== 0)
// 					// {
// 					// 	tmin = triangle_end - triangle_start;
// 					// }



// 					// if (triangle_end - triangle_start !== 0)
// 					// {
// 						// const size = max[0] - min[0];

// 						// const box = new THREE.Mesh(new THREE.BoxGeometry(size, size, size), new THREE.MeshBasicMaterial({ wireframe: true, color: 'green' }));

// 						// box.position.set((max[0] + min[0]) * 0.5, (max[1] + min[1]) * 0.5, (max[2] + min[2]) * 0.5);

// 						// scene.add(box);
// 					// }
// 					// else
// 					// {
// 					// 	LOG(x, y, z)
// 					// }



// 					this.data_f32[box_index + 0] = min[0];
// 					this.data_f32[box_index + 1] = min[1];
// 					this.data_f32[box_index + 2] = min[2];

// 					this.data_f32[box_index + 3] = max[0];
// 					this.data_f32[box_index + 4] = max[1];
// 					this.data_f32[box_index + 5] = max[2];

// 					this.data_ui32[box_index + 6] = triangle_start;
// 					this.data_ui32[box_index + 7] = triangle_end;
// 				}
// 			}
// 		}

// 		// LOG('tmin', tmin)
// 		// LOG('tmax', tmax)
// 	}
// }



// const sph = new THREE.Mesh(sphere, new THREE.MeshBasicMaterial({ color: 'red', wireframe: true }));

// scene.add(sph);

// const sphere_object = new BoxTree(sphere.attributes.position.array, sphere.index.array);

// sphere_object.makeBoundingBox();
// sphere_object.test();

// LOG(sphere_object)

// const mouse = new THREE.Vector2();

// const ray_origin = [ 0, 0, 0 ];
// const ray_direction = [ 0, 0, 0 ];



// window.addEventListener
// (
// 	'mousemove',

// 	(evt) =>
// 	{
// 		mouse.x = ((evt.clientX / window.innerWidth) * 2) - 1;
// 		mouse.y = (-(evt.clientY / window.innerHeight) * 2) + 1;



// 		rc.setFromCamera(mouse, camera);



// 		ray_origin[0] = rc.ray.origin.x;
// 		ray_origin[1] = rc.ray.origin.y;
// 		ray_origin[2] = rc.ray.origin.z;

// 		ray_direction[0] = rc.ray.direction.x;
// 		ray_direction[1] = rc.ray.direction.y;
// 		ray_direction[2] = rc.ray.direction.z;



// 		nearest_ray_triangle_intersection = Infinity;

// 		vcopy(intersection, ray_origin);

// 		if (getRayBoxIntersection(ray_origin, ray_direction, sphere_object.min, sphere_object.max, intersection_box, intersection_box_far1))
// 		{
// 			// pointer2.position.set((min[0] + max[0]) * 0.5, (min[1] + max[1]) * 0.5, (min[2] + max[2]) * 0.5);

// 			const size = sphere_object.max[0] - sphere_object.min[0];
// 			const segment_size = size / dimension_segment_count;

// 			// let x = Math.floor((intersection_box[0] + (size * 0.5)) / segment_size);
// 			// let y = Math.floor((intersection_box[1] + (size * 0.5)) / segment_size);
// 			// let z = Math.floor((intersection_box[2] + (size * 0.5)) / segment_size);

// 			let x = Math.floor((intersection_box[0] - sphere_object.min[0]) / segment_size);
// 			let y = Math.floor((intersection_box[1] - sphere_object.min[1]) / segment_size);
// 			let z = Math.floor((intersection_box[2] - sphere_object.min[2]) / segment_size);

// 			x === -1 && (++x);
// 			y === -1 && (++y);
// 			z === -1 && (++z);

// 			x === dimension_segment_count && (--x);
// 			y === dimension_segment_count && (--y);
// 			z === dimension_segment_count && (--z);



// 			let box_index = (x * dimension_segment_count * dimension_segment_count + y * dimension_segment_count + z) * 8;

// 			const min = new Float32Array(3);

// 			min[0] = sphere_object.data_f32[box_index + 0];
// 			min[1] = sphere_object.data_f32[box_index + 1];
// 			min[2] = sphere_object.data_f32[box_index + 2];

// 			const max = new Float32Array(3);

// 			max[0] = sphere_object.data_f32[box_index + 3];
// 			max[1] = sphere_object.data_f32[box_index + 4];
// 			max[2] = sphere_object.data_f32[box_index + 5];

// 			let i = 0;

// 			for (let i = 0; i < dimension_segment_count; ++i)
// 			{
// 				let triangle_start = sphere_object.data_ui32[box_index + 6];
// 				const triangle_end = sphere_object.data_ui32[box_index + 7];

// 				if (triangle_start < triangle_end)
// 				{
// 					let qwe = 0;

// 					for (; triangle_start < triangle_end; ++triangle_start)
// 					{
// 						const triangle_index = sphere_object.triangles_data[triangle_start];

// 						const triangle_first_point_index = triangle_index;

// 						const vertex1_index = sphere_object.index_data[triangle_first_point_index];
// 						const vertex2_index = sphere_object.index_data[triangle_first_point_index + 1];
// 						const vertex3_index = sphere_object.index_data[triangle_first_point_index + 2];

// 						const vertex1_x_coord_index = vertex1_index * 3;
// 						const vertex2_x_coord_index = vertex2_index * 3;
// 						const vertex3_x_coord_index = vertex3_index * 3;

// 						p1[0] = sphere_object.position_data[vertex1_x_coord_index];
// 						p1[1] = sphere_object.position_data[vertex1_x_coord_index + 1];
// 						p1[2] = sphere_object.position_data[vertex1_x_coord_index + 2];

// 						p2[0] = sphere_object.position_data[vertex2_x_coord_index];
// 						p2[1] = sphere_object.position_data[vertex2_x_coord_index + 1];
// 						p2[2] = sphere_object.position_data[vertex2_x_coord_index + 2];

// 						p3[0] = sphere_object.position_data[vertex3_x_coord_index];
// 						p3[1] = sphere_object.position_data[vertex3_x_coord_index + 1];
// 						p3[2] = sphere_object.position_data[vertex3_x_coord_index + 2];

// 						if (!getRayTriangleIntersection(ray_origin, ray_direction, p1, p2, p3, false, intersection))
// 						{
// 							continue;
// 						}

// 						++qwe;

// 						const ray_origin_to_intersection_distance = vdist(ray_origin, intersection);

// 						if (ray_origin_to_intersection_distance < nearest_ray_triangle_intersection && ray_origin_to_intersection_distance > 0.001)
// 						{
// 							nearest_ray_triangle_intersection = ray_origin_to_intersection_distance;
// 						}
// 					}

// 					if (qwe)
// 					{
// 						pointer.position.set(...intersection);
// 						pointer2.position.set((min[0] + max[0]) * 0.5, (min[1] + max[1]) * 0.5, (min[2] + max[2]) * 0.5);

// 						// LOG(...intersection)
// 						// return;

// 						break;
// 					}
// 				}

// 				min[0] = sphere_object.data_f32[box_index + 0];
// 				min[1] = sphere_object.data_f32[box_index + 1];
// 				min[2] = sphere_object.data_f32[box_index + 2];

// 				max[0] = sphere_object.data_f32[box_index + 3];
// 				max[1] = sphere_object.data_f32[box_index + 4];
// 				max[2] = sphere_object.data_f32[box_index + 5];

// 				getRayBoxIntersection(ray_origin, ray_direction, min, max, intersection_box, intersection_box_far);

// 				if
// 				(
// 					vdist(intersection_box_far, intersection_box_far1) < 0.00001
// 				)
// 				{
// 					break;
// 				}

// 				// x = Math.floor((intersection_box_far[0] + (size * 0.5)) / segment_size);
// 				// y = Math.floor((intersection_box_far[1] + (size * 0.5)) / segment_size);
// 				// z = Math.floor((intersection_box_far[2] + (size * 0.5)) / segment_size);

// 				// const aa = min.map((val, val_index) => (intersection_box_far[val_index] - val));
// 				// const bb = max.map((val, val_index) => (intersection_box_far[val_index] - val));

// 				// LOG(...aa, '___', ...bb)

// 				// x -= 1 - Number(Boolean(aa[0] / aa[0]));
// 				// x += 1 - Number(Boolean(bb[0] / bb[0]));

// 				// y -= 1 - Number(Boolean(aa[1] / aa[1]));
// 				// y += 1 - Number(Boolean(bb[1] / bb[1]));

// 				// z -= 1 - Number(Boolean(aa[2] / aa[2]));
// 				// z += 1 - Number(Boolean(bb[2] / bb[2]));

// 				// x += Number(Boolean(aa[0] / aa[0])) - Number(Boolean(bb[0] / bb[0]));
// 				// y += Number(Boolean(aa[1] / aa[1])) - Number(Boolean(bb[1] / bb[1]));
// 				// z += Number(Boolean(aa[2] / aa[2])) - Number(Boolean(bb[2] / bb[2]));

// 				// xyz += (aa / aa) - (bb / bb);

// 				if (Math.abs(intersection_box_far[0] - min[0]) < 0.00001)
// 				{
// 					--x;
// 				}
// 				else if (Math.abs(intersection_box_far[0] - max[0]) < 0.00001)
// 				{
// 					++x;
// 				}

// 				if (Math.abs(intersection_box_far[1] - min[1]) < 0.00001)
// 				{
// 					--y;
// 				}
// 				else if (Math.abs(intersection_box_far[1] - max[1]) < 0.00001)
// 				{
// 					++y;
// 				}

// 				if (Math.abs(intersection_box_far[2] - min[2]) < 0.00001)
// 				{
// 					--z;
// 				}
// 				else if (Math.abs(intersection_box_far[2] - max[2]) < 0.00001)
// 				{
// 					++z;
// 				}

// 				x === -1 && (++x);
// 				y === -1 && (++y);
// 				z === -1 && (++z);

// 				x === dimension_segment_count && (--x);
// 				y === dimension_segment_count && (--y);
// 				z === dimension_segment_count && (--z);

// 				// LOG(x, y, z)

// 				// next box index
// 				box_index = (x * dimension_segment_count * dimension_segment_count + y * dimension_segment_count + z) * 8;
// 			}
// 		}

// 		renderer.render(scene, camera);
// 	},
// );

// LOG('Ready');
