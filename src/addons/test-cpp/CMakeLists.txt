project("test-cpp")

# global
# include_directories(${CMAKE_JS_INC})

file(GLOB SOURCE_FILES "src/test.cpp")

add_library(${PROJECT_NAME} SHARED ${SOURCE_FILES} ${CMAKE_JS_SRC})

# set_property(${PROJECT_NAME} tgt PROPERTY CXX_STANDARD 20)

set_target_properties(${PROJECT_NAME} PROPERTIES PREFIX "" SUFFIX ".node")

target_include_directories(${PROJECT_NAME} PRIVATE ${CMAKE_JS_INC} "${CMAKE_SOURCE_DIR}/node_modules/node-addon-api")

# For renderity includes and renderity internal includes
target_include_directories(${PROJECT_NAME} PRIVATE ${CMAKE_JS_INC} "/home/denis/reps" "/home/denis/reps/renderity")

target_link_libraries(${PROJECT_NAME} ${CMAKE_JS_LIB} /home/denis/reps/renderity/test/build/gcc-x64/output/a/test.a)

add_custom_target(math WORKING_DIRECTORY /home/denis/reps/renderity/math/src COMMAND cd /home/denis/reps/renderity/test && genmake gcc-x64)
add_custom_target(aux WORKING_DIRECTORY /home/denis/reps/renderity/aux/src COMMAND cd /home/denis/reps/renderity/test && genmake gcc-x64)
add_custom_target(wrappers WORKING_DIRECTORY /home/denis/reps/renderity/wrappers/src COMMAND cd /home/denis/reps/renderity/test && genmake gcc-x64)
add_custom_target(renderers WORKING_DIRECTORY /home/denis/reps/renderity/renderers/src COMMAND cd /home/denis/reps/renderity/test && genmake gcc-x64)
add_custom_target(test WORKING_DIRECTORY /home/denis/reps/renderity/test/src COMMAND cd /home/denis/reps/renderity/test && genmake gcc-x64)

add_dependencies(${PROJECT_NAME} math)
add_dependencies(${PROJECT_NAME} aux)
add_dependencies(${PROJECT_NAME} wrappers)
add_dependencies(${PROJECT_NAME} renderers)
add_dependencies(${PROJECT_NAME} test)
