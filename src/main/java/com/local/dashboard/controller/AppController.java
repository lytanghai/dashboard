package com.local.dashboard.controller;

import com.local.dashboard.model.LibraryItem;
import com.local.dashboard.service.LibraryService;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;

@Controller
@RequestMapping("/api/library")
public class AppController {


    @Autowired
    private LibraryService libraryService;

    @PostMapping
    public ResponseEntity<LibraryItem> createItem(
            @RequestBody LibraryItem item) {

        LibraryItem savedItem = libraryService.create(item);

        return ResponseEntity
                .status(HttpStatus.CREATED)
                .body(savedItem);
    }

    @PutMapping("/{id}")
    public ResponseEntity<LibraryItem> updateItem(
            @PathVariable String id,
            @RequestBody LibraryItem item) {

        LibraryItem updatedItem = libraryService.update(id, item);

        return ResponseEntity.ok(updatedItem);
    }

    // DELETE
    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void delete(@PathVariable String id) {
        libraryService.delete(id);
    }

}
