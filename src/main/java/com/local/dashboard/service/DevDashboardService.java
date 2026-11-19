package com.local.dashboard.service;

import com.local.dashboard.model.LibraryItem;
import com.local.dashboard.util.ReaderUtils;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import tools.jackson.databind.ObjectMapper;

import java.util.List;

@Service
@RequiredArgsConstructor
public class DevDashboardService {

    @Value("${app.storage.file:./data/library.json}")
    private String dataPath;

    public List<LibraryItem>  readLibraryTitle() {
        ReaderUtils readerUtils = new ReaderUtils(new ObjectMapper());
        return readerUtils.readJson(dataPath);
    }

}
