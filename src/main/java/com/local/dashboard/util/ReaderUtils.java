package com.local.dashboard.util;

import com.local.dashboard.model.LibraryItem;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;

public class ReaderUtils {

    private final ObjectMapper objectMapper;

    public ReaderUtils(ObjectMapper objectMapper) {
        this.objectMapper = objectMapper;
    }

    public List<LibraryItem> readJson(String location) {
        try {
            Path path = Paths.get(location);

            return objectMapper.readValue(
                    path.toFile(),
                    new TypeReference<List<LibraryItem>>() {}
            );

        } catch (Exception e) {
            throw new RuntimeException("Cannot read JSON file", e);
        }
    }
}
