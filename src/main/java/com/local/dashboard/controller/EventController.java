package com.local.dashboard.controller;

import com.local.dashboard.model.EventItem;
import com.local.dashboard.service.EventService;
import org.springframework.stereotype.Controller;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.ResponseBody;

import java.util.List;

@Controller
public class EventController {

    private final EventService eventService;

    public EventController(EventService eventService) {
        this.eventService = eventService;
    }

    @GetMapping("/live_event")
    public String liveEvent() {
        return "schedule";
    }

    @GetMapping("/api/events")
    @ResponseBody
    public List<EventItem> getEvents(
            @RequestParam(required = false) String date) {
        return eventService.getEvents(date);
    }

    @PostMapping("/api/events")
    @ResponseBody
    public EventItem createEvent(@RequestBody EventItem event) {
        return eventService.createEvent(event);
    }

    @DeleteMapping("/api/events/{id}")
    @ResponseBody
    public void deleteEvent(@PathVariable String id) {
        eventService.deleteEvent(id);
    }
}