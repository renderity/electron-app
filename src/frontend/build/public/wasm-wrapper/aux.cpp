#include <cstddef>
#include <cstdint>
#include <cstdlib>
#include <cstring>
#include <cxxabi.h>
#include <string>
#include <vector>



extern "C" size_t RDTY_WASM_WRAPPER_sizeof (const size_t type)
{
  switch (type)
  {
    case 0: return sizeof(void*);
    case 1: return sizeof(size_t);
    case 2: return sizeof(uint32_t);
    case 3: return sizeof(float);
  }
}

extern "C" void* RDTY_WASM_WRAPPER_getStdVectorData (std::vector<int>& v)
{
  return v.data();
}

extern "C" size_t RDTY_WASM_WRAPPER_getStdVectorSize (std::vector<int>& v)
{
  return v.size();
}

extern "C" void RDTY_WASM_WRAPPER_StdVector_resize (std::vector<int>& v, const size_t size)
{
  v.resize(size);
}

extern "C" void* RDTY_WASM_WRAPPER_getStdStringData (std::string& s)
{
  return s.data();
}

extern "C" size_t RDTY_WASM_WRAPPER_getStdStringSize (std::string& s)
{
  return s.size();
}

extern "C" char* RDTY_WASM_WRAPPER_malloc (const size_t size)
{
  return new char [size];
}

extern "C" void RDTY_WASM_WRAPPER_free (char* addr)
{
  delete[] addr;
}

extern "C" const char* RDTY_WASM_WRAPPER_demangleCxxName (char* mangled_name)
{
  int status {};
  char* realname { abi::__cxa_demangle(mangled_name, 0, 0, &status) };
  const char* _realname { realname };
  free(realname);

  return _realname;
}
