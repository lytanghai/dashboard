package com.local.dashboard.service;


import com.local.dashboard.model.LibraryItem;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.server.ResponseStatusException;

import org.springframework.http.HttpStatus;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.io.IOException;
import java.nio.file.*;
import java.time.LocalDateTime;
import java.util.*;

@Service
public class LibraryService {
    private final ObjectMapper objectMapper;
    private final Path filePath;

    public LibraryService(
            ObjectMapper objectMapper,
            @Value("${app.storage.file:./data/library.json}") String file
    ) {
        this.objectMapper = objectMapper;
        this.filePath = Paths.get(file);
    }

    public synchronized List<LibraryItem> findAll() {
        if (!Files.exists(filePath)) {
            return new ArrayList<>();
        }

        return objectMapper.readValue(
                filePath.toFile(),
                new TypeReference<List<LibraryItem>>() {}
        );

    }

    public synchronized LibraryItem create(LibraryItem item) {
        List<LibraryItem> items = findAll();

        LocalDateTime now = LocalDateTime.now();

        item.setId(UUID.randomUUID().toString());
        item.setCreatedAt(now);
        item.setUpdatedAt(now);

        items.add(item);
        saveAll(items);

        return item;
    }

    public synchronized LibraryItem update(String id, LibraryItem updatedItem) {
        List<LibraryItem> items = findAll();

        for (int i = 0; i < items.size(); i++) {
            LibraryItem existing = items.get(i);

            if (existing.getId().equals(id)) {
                updatedItem.setId(id);
                updatedItem.setCreatedAt(existing.getCreatedAt());
                updatedItem.setUpdatedAt(LocalDateTime.now());

                items.set(i, updatedItem);
                saveAll(items);

                return updatedItem;
            }
        }

        throw new ResponseStatusException(
                HttpStatus.NOT_FOUND, "Library item not found"
        );
    }

    public synchronized void delete(String id) {
        List<LibraryItem> items = findAll();

        boolean removed = items.removeIf(
                item -> item.getId().equals(id)
        );

        if (!removed) {
            throw new ResponseStatusException(
                    HttpStatus.NOT_FOUND, "Library item not found"
            );
        }

        saveAll(items);
    }

    private void saveAll(List<LibraryItem> items) {
        try {
            Path parent = filePath.getParent();

            if (parent != null) {
                Files.createDirectories(parent);
            }

            Path tempFile = filePath.resolveSibling(
                    filePath.getFileName() + ".tmp"
            );

            objectMapper.writerWithDefaultPrettyPrinter()
                    .writeValue(tempFile.toFile(), items);

            try {
                Files.move(
                        tempFile,
                        filePath,
                        StandardCopyOption.REPLACE_EXISTING,
                        StandardCopyOption.ATOMIC_MOVE
                );
            } catch (AtomicMoveNotSupportedException e) {
                Files.move(
                        tempFile,
                        filePath,
                        StandardCopyOption.REPLACE_EXISTING
                );
            }

        } catch (IOException e) {
            throw new RuntimeException("Cannot save library JSON", e);
        }
    }
}
