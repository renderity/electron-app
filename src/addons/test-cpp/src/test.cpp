#define EXPORT_FUNCTION(function_name) exports[#function_name] = Napi::Function::New<Callback>(env, function_name);
#define EXPORT_FUNCTION_VOID(function_name) exports[#function_name] = Napi::Function::New<VoidCallback>(env, function_name);
#define EXPORT_OBJECT(name) exports[#name] = name;



#include <cstdint>
#include <cstring>
#include <thread>

#include "napi.h"

#include "renderity/renderers/src/base/renderer.h"



extern void initOpengl (void);
extern void initVulkan (void);



extern RDTY::RENDERERS::Renderer* renderer_native;



void rendernig_thread (void)
{
	initOpengl();
	// initVulkan();
}

std::thread* rendernig_thread_handle {};

Napi::Value testRenderingThread (const Napi::CallbackInfo& info)
{
	return Napi::Boolean::New(info.Env(), rendernig_thread_handle != nullptr);
}

void runRenderingThread (const Napi::CallbackInfo& info)
{
	rendernig_thread_handle = new std::thread { rendernig_thread };
}

void stopRenderingThread (const Napi::CallbackInfo& info)
{
	delete rendernig_thread_handle;
}

Napi::Value getPixelDataStorageIsAllocated (const Napi::CallbackInfo& info)
{
	return Napi::Boolean::New(info.Env(), renderer_native->pixel_data != nullptr);
}

Napi::Value getRendererSize (const Napi::CallbackInfo& info)
{
	Napi::Object renderer_size { Napi::Object::New(info.Env()) };

	renderer_size["renderer_width"] = Napi::Number::New(info.Env(), renderer_native->wrapper->width);
	renderer_size["renderer_height"] = Napi::Number::New(info.Env(), renderer_native->wrapper->height);

	return renderer_size;
}

Napi::Value getPixelDataStorage (const Napi::CallbackInfo& info)
{
	Napi::ArrayBuffer arraybuffer
	{
		Napi::ArrayBuffer::New
		(
			info.Env(),
			renderer_native->pixel_data,
			renderer_native->wrapper->width * renderer_native->wrapper->height * 4
		),
	};

	Napi::TypedArrayOf<uint8_t> uint8_clamped_array
	{
		Napi::TypedArrayOf<uint8_t>::New
		(
			info.Env(),
			arraybuffer.ByteLength(),
			arraybuffer,
			0,
			napi_uint8_clamped_array
		),
	};

	return uint8_clamped_array;
}

// void rotateOrbitJs (const CallbackInfo& info)
// {
// 	rotateOrbit(info[0].As<Number>(), info[1].As<Number>());
// }

Napi::Object Init (Napi::Env env, Napi::Object exports)
{
	using Callback = Napi::Value (*) (const Napi::CallbackInfo&);
	using VoidCallback = void (*) (const Napi::CallbackInfo&);

	EXPORT_FUNCTION(testRenderingThread);
	EXPORT_FUNCTION_VOID(runRenderingThread);
	EXPORT_FUNCTION_VOID(stopRenderingThread);
	EXPORT_FUNCTION(getPixelDataStorageIsAllocated);
	EXPORT_FUNCTION(getRendererSize);
	EXPORT_FUNCTION(getPixelDataStorage);
	// EXPORT_FUNCTION_VOID(rotateOrbitJs);

	return exports;
}

NODE_API_MODULE(node_api_test, Init)
