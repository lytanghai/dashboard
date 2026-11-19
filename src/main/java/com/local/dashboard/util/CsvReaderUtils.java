package com.local.dashboard.util;

import lombok.extern.slf4j.Slf4j;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;

import java.io.IOException;
import java.io.InputStream;
import java.io.InputStreamReader;
import java.io.Reader;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;

@Slf4j
public class CsvReaderUtils {

    public static CSVParser parser(String path, boolean skipHeader) throws IOException {
        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(skipHeader)
                .build();

        Reader reader = Files.newBufferedReader(
                Path.of(path),
                StandardCharsets.UTF_8
        );

        try {
            return format.parse(reader);
        } catch (IOException | RuntimeException e) {
            reader.close();
            throw e;
        }
    }

    public static CSVParser parser(InputStream inputStream, boolean skipHeader)
            throws IOException {

        CSVFormat format = CSVFormat.DEFAULT.builder()
                .setHeader()
                .setSkipHeaderRecord(skipHeader)
                .build();

        return format.parse(
                new InputStreamReader(inputStream, StandardCharsets.UTF_8)
        );
    }

}