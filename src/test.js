const __CPP_MODULE__ = require('./addons/test-cpp/build/Release/test-cpp.node');



const
	{
		testRenderingThread,
		runRenderingThread,
		testPixelData,
		createJsPixelDataWrappers,
		getPixelData,
	}	= __CPP_MODULE__;



// window.addEventListener
// (
// 	'load',

// 	async () =>
// 	{
// 		if (!testRenderingThread())
// 		{
// 			runRenderingThread();
// 		}

// 		let interval = null;

// 		await new Promise
// 		(
// 			(resolve) =>
// 			{
// 				interval =
// 					setInterval
// 					(
// 						() =>
// 						{
// 							if (testPixelData())
// 							{
// 								clearInterval(interval);

// 								resolve();
// 							}
// 						},

// 						1000,
// 					);
// 			},
// 		);

// 		createJsPixelDataWrappers();

// 		// const image_data = new ImageData(getPixelData(), 800, 600);

// 		const render = () =>
// 		{
// 			image_data.data.set(getPixelData());

// 			canvas_context.putImageData(image_data, 0, 0);

// 			requestAnimationFrame(render);
// 		};

// 		render();
// 	},
// );

createJsPixelDataWrappers();

const a = getPixelData();

a[0] = 123;

console.log(ImageData);

// setTimeout
// (
// 	() =>
// 	{
// 		runRenderingThread();
// 	},

// 	3000,
// );
