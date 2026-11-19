package com.local.dashboard.service;

import com.local.dashboard.model.EventItem;
import jakarta.annotation.PostConstruct;
import org.springframework.stereotype.Service;
import tools.jackson.core.type.TypeReference;
import tools.jackson.databind.ObjectMapper;

import java.io.File;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
public class EventService {

    private final tools.jackson.databind.ObjectMapper mapper;
    private final File file = new File("./data/events.json");

    private List<EventItem> events = new ArrayList<>();

    public EventService(ObjectMapper mapper) {
        this.mapper = mapper;
    }

    @PostConstruct
    public void loadEvents() {
        try {
            File directory = file.getParentFile();

            if (!directory.exists()) {
                directory.mkdirs();
            }

            if (!file.exists()) {
                file.createNewFile();
                saveToFile();
                return;
            }

            events = mapper.readValue(
                    file,
                    new TypeReference<List<EventItem>>() {}
            );

            if (events == null) {
                events = new ArrayList<>();
            }

        } catch (Exception e) {
            throw new RuntimeException("Unable to load events JSON", e);
        }
    }

    public synchronized List<EventItem> getEvents(String date) {
        return events.stream()
                .filter(e -> date == null || date.equals(e.getDate()))
                .sorted(Comparator.comparing(EventItem::getTime))
                .collect(Collectors.toList());
    }

    public synchronized EventItem createEvent(EventItem event) {
        event.setId(UUID.randomUUID().toString());

        events.add(event);
        saveToFile();

        return event;
    }

    public synchronized void deleteEvent(String id) {
        events.removeIf(e -> e.getId().equals(id));
        saveToFile();
    }

    private void saveToFile() {
        try {
            mapper.writerWithDefaultPrettyPrinter()
                    .writeValue(file, events);
        } catch (Exception e) {
            throw new RuntimeException("Unable to save events JSON", e);
        }
    }
}