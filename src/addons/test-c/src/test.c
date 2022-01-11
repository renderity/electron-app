#define EXPORT_FUNCTION(function_name, napi_value_name)\
napi_value napi_value_name;\
\
napi_create_function\
(\
	env,\
	#function_name,\
	NAPI_AUTO_LENGTH,\
	function_name,\
	NULL,\
	&napi_value_name\
);\
\
napi_set_named_property\
(\
	env,\
	result,\
	#function_name,\
	napi_value_name\
);



#include <stdlib.h>
#include <string.h>
#include <stdio.h>
#include <node_api.h>



napi_ref arraybuffer_ref;
napi_ref typedarray_ref;

uint32_t _data [1] = { 2 };

napi_value createData (napi_env env, napi_callback_info info)
{
	napi_value arraybuffer;
	napi_value typedarray;

	napi_create_external_arraybuffer(env, _data, 4, NULL, NULL, &arraybuffer);

	napi_create_reference(env, arraybuffer, 1, &arraybuffer_ref);

	napi_create_typedarray(env, napi_uint8_array, 4, arraybuffer, 0, &typedarray);

	napi_create_reference(env, typedarray, 1, &typedarray_ref);

	return NULL;
}

napi_value getData (napi_env env, napi_callback_info info)
{
	// napi_value arraybuffer;

	// napi_get_reference_value(env, arraybuffer_ref, &arraybuffer);

	// return arraybuffer;

	napi_value typedarray;

	napi_get_reference_value(env, typedarray_ref, &typedarray);

	return typedarray;
}

napi_value modifyData (napi_env env, napi_callback_info info)
{
	memset(_data, 1, 4);

	return NULL;
}

napi_value createAddon (napi_env env)
{
	napi_value result;

	napi_create_object(env, &result);

	EXPORT_FUNCTION(createData, export1);
	EXPORT_FUNCTION(getData, export2);
	EXPORT_FUNCTION(modifyData, export2);

	return result;
}

NAPI_MODULE_INIT ()
{
	return createAddon(env);
}
