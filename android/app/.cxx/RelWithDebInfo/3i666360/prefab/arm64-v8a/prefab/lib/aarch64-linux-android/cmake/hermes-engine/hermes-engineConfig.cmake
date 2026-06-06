if(NOT TARGET hermes-engine::hermesvm)
add_library(hermes-engine::hermesvm SHARED IMPORTED)
set_target_properties(hermes-engine::hermesvm PROPERTIES
    IMPORTED_LOCATION "C:/Users/Freedom Labs/.gradle/caches/9.3.1/transforms/15e3fc8dbe39a8c640ac544f5279a495/workspace/transformed/hermes-android-250829098.0.10-release/prefab/modules/hermesvm/libs/android.arm64-v8a/libhermesvm.so"
    INTERFACE_INCLUDE_DIRECTORIES "C:/Users/Freedom Labs/.gradle/caches/9.3.1/transforms/15e3fc8dbe39a8c640ac544f5279a495/workspace/transformed/hermes-android-250829098.0.10-release/prefab/modules/hermesvm/include"
    INTERFACE_LINK_LIBRARIES ""
)
endif()

