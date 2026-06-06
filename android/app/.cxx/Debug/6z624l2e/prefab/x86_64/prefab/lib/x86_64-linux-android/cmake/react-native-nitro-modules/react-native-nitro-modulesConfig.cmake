if(NOT TARGET react-native-nitro-modules::NitroModules)
add_library(react-native-nitro-modules::NitroModules SHARED IMPORTED)
set_target_properties(react-native-nitro-modules::NitroModules PROPERTIES
    IMPORTED_LOCATION "E:/Chaton/node_modules/react-native-nitro-modules/android/build/intermediates/cxx/Debug/4o6r71yz/obj/x86_64/libNitroModules.so"
    INTERFACE_INCLUDE_DIRECTORIES "E:/Chaton/node_modules/react-native-nitro-modules/android/build/headers/nitromodules"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

