package com.local.dashboard.service;

import com.local.dashboard.dto.request.FinanceRecordReqDto;
import com.local.dashboard.dto.response.FinanceResponseDto;
import com.local.dashboard.dto.response.Record;
import com.local.dashboard.enumz.Category;
import com.local.dashboard.enumz.Currency;
import com.local.dashboard.enumz.Type;
import com.local.dashboard.util.CsvReaderUtils;
import com.local.dashboard.util.DateUtils;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVRecord;
import org.springframework.stereotype.Service;

import org.apache.commons.csv.CSVFormat;
import org.apache.commons.csv.CSVParser;
import org.apache.commons.csv.CSVPrinter;
import org.apache.commons.csv.CSVRecord;

import java.io.BufferedWriter;
import java.io.FileNotFoundException;
import java.io.IOException;
import java.io.InputStream;
import java.math.BigDecimal;
import java.nio.charset.StandardCharsets;
import java.nio.file.AtomicMoveNotSupportedException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.StandardCopyOption;
import java.nio.file.StandardOpenOption;
import java.time.LocalDate;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;

@Service
@RequiredArgsConstructor
@Slf4j
public class FinanceService {

    private static final List<String> FINANCE_HEADERS = List.of(
            "No", "Category", "Type", "Amount", "Currency", "Date", "Remark"
    );

    private static final Path FINANCE_DIRECTORY =
            Path.of("D:\\dashboard\\src\\main\\resources\\finance");


    /**
     * Resolve the CSV file for the selected month.
     */
    private Path getFinanceFile(String month) {

        YearMonth selectedMonth = (month == null || month.isBlank())
                ? YearMonth.now()
                : YearMonth.parse(month);

        return FINANCE_DIRECTORY.resolve(selectedMonth + ".csv");
    }


    /**
     * Query monthly finance records.
     */
    public FinanceResponseDto queryCsvRecords(String month) throws IOException {

        Path path = getFinanceFile(month);

        List<Record> records = new ArrayList<>();
        List<String> headers = FINANCE_HEADERS;

        if (Files.exists(path) && Files.size(path) > 0) {

            try (InputStream inputStream = Files.newInputStream(path);
                 CSVParser csv = CsvReaderUtils.parser(inputStream, false)) {

                headers = csv.getHeaderNames();

                for (CSVRecord record : csv) {
                    records.add(mapToRecord(record));
                }
            }
        }

        FinanceResponseDto response = new FinanceResponseDto();
        response.setHeader(headers);
        response.setRecords(records);

        return response;
    }


    /**
     * Create a new finance record.
     */
    public synchronized void createNewRecord(
            FinanceRecordReqDto recordReqDto,
            String month) throws IOException {

        Path path = getFinanceFile(month);

        Files.createDirectories(path.getParent());

        CsvData csvData = readCsv(path);

        String transactionDate =
                (recordReqDto.getDate() == null || recordReqDto.getDate().isBlank())
                        ? DateUtils.formatYMD()
                        : LocalDate.parse(recordReqDto.getDate()).toString();

        int nextNo = csvData.rows().stream()
                .mapToInt(row -> Integer.parseInt(row.get(0)))
                .max()
                .orElse(0) + 1;

        List<String> newRecord = List.of(
                String.valueOf(nextNo),
                recordReqDto.getCategory().name(),
                recordReqDto.getType().name(),
                recordReqDto.getAmount().toString(),
                recordReqDto.getCurrency().name(),
                transactionDate,
                Objects.toString(recordReqDto.getRemark(), "")
        );

        List<List<String>> records = new ArrayList<>(csvData.rows());
        records.add(newRecord);

        writeCsv(path, csvData.headers(), records);

        log.info("{} - Finance record successfully created. No: {}",
                path.toAbsolutePath(), nextNo);
    }


    /**
     * Update an existing finance record.
     */
    public synchronized void updateRecord(
            FinanceRecordReqDto recordReqDto,
            String month) throws IOException {

        Integer no = Objects.requireNonNull(
                recordReqDto.getNo(), "Finance record number is required"
        );

        Path path = getFinanceFile(month);

        if (!Files.exists(path)) {
            throw new FileNotFoundException(
                    "Finance file not found: " + path.getFileName()
            );
        }

        CsvData csvData = readCsv(path);

        boolean recordFound = false;
        List<List<String>> updatedRows = new ArrayList<>();

        for (List<String> row : csvData.rows()) {

            Map<String, String> existingRecord =
                    toRecordMap(csvData.headers(), row);

            int recordNo = Integer.parseInt(existingRecord.get("No"));

            if (recordNo == no) {

                List<String> updatedRecord = csvData.headers().stream()
                        .map(header -> switch (header) {
                            case "No" -> String.valueOf(no);
                            case "Category" -> recordReqDto.getCategory().name();
                            case "Type" -> recordReqDto.getType().name();
                            case "Amount" -> recordReqDto.getAmount().toString();
                            case "Currency" -> recordReqDto.getCurrency().name();

                            // Preserve the original transaction date.
                            case "Date" -> existingRecord.get("Date");

                            case "Remark" -> Objects.toString(
                                    recordReqDto.getRemark(), ""
                            );

                            default -> existingRecord.get(header);
                        })
                        .toList();

                updatedRows.add(updatedRecord);
                recordFound = true;

            } else {
                updatedRows.add(row);
            }
        }

        if (!recordFound) {
            throw new IllegalArgumentException(
                    "Finance record not found. No: " + no
            );
        }

        writeCsv(path, csvData.headers(), updatedRows);

        log.info("{} - Finance record successfully updated. No: {}",
                path.toAbsolutePath(), no);
    }


    /**
     * Delete an existing finance record.
     */
    public synchronized void deleteRecord(
            Integer no,
            String month) throws IOException {

        Path path = getFinanceFile(month);

        if (!Files.exists(path)) {
            throw new FileNotFoundException(
                    "Finance file not found: " + path.getFileName()
            );
        }

        CsvData csvData = readCsv(path);

        List<List<String>> remainingRows = new ArrayList<>();

        boolean recordFound = false;

        for (List<String> row : csvData.rows()) {

            Map<String, String> existingRecord =
                    toRecordMap(csvData.headers(), row);

            int recordNo = Integer.parseInt(existingRecord.get("No"));

            if (recordNo == no) {
                recordFound = true;
                continue;
            }

            remainingRows.add(row);
        }

        if (!recordFound) {
            throw new IllegalArgumentException(
                    "Finance record not found. No: " + no
            );
        }

        writeCsv(path, csvData.headers(), remainingRows);

        log.info("{} - Finance record successfully deleted. No: {}",
                path.toAbsolutePath(), no);
    }

    /**
     * Read CSV file into memory.
     */
    private CsvData readCsv(Path path) throws IOException {

        if (!Files.exists(path) || Files.size(path) == 0) {
            return new CsvData(FINANCE_HEADERS, new ArrayList<>());
        }

        List<String> headers;
        List<List<String>> rows = new ArrayList<>();

        try (InputStream inputStream = Files.newInputStream(path);
             CSVParser csvParser = CsvReaderUtils.parser(inputStream, true)) {

            headers = csvParser.getHeaderNames();

            for (CSVRecord record : csvParser) {

                List<String> row = new ArrayList<>();

                record.forEach(row::add);

                rows.add(row);
            }
        }

        return new CsvData(headers, rows);
    }


    /**
     * Write CSV using a temporary file and replace the original.
     */
    private void writeCsv(
            Path path,
            List<String> headers,
            List<List<String>> rows) throws IOException {

        Files.createDirectories(path.getParent());

        Path tempPath = Files.createTempFile(
                path.getParent(), "finance-", ".tmp"
        );

        try {

            try (BufferedWriter writer = Files.newBufferedWriter(
                    tempPath,
                    StandardCharsets.UTF_8,
                    StandardOpenOption.WRITE,
                    StandardOpenOption.TRUNCATE_EXISTING);
                 CSVPrinter printer = new CSVPrinter(writer, CSVFormat.DEFAULT)) {

                printer.printRecord(headers);

                for (List<String> row : rows) {
                    printer.printRecord(row);
                }
            }

            try {
                Files.move(
                        tempPath,
                        path,
                        StandardCopyOption.REPLACE_EXISTING,
                        StandardCopyOption.ATOMIC_MOVE
                );

            } catch (AtomicMoveNotSupportedException e) {

                Files.move(
                        tempPath,
                        path,
                        StandardCopyOption.REPLACE_EXISTING
                );
            }

        } finally {
            Files.deleteIfExists(tempPath);
        }
    }


    /**
     * Convert CSV record into Finance Record DTO.
     */
    private Record mapToRecord(CSVRecord record) {

        return Record.builder()
                .no(record.get("No"))
                .category(Category.valueOf(
                        record.get("Category").toUpperCase(Locale.ROOT)
                ))
                .type(Type.valueOf(
                        record.get("Type").toUpperCase(Locale.ROOT)
                ))
                .amount(new BigDecimal(record.get("Amount")))
                .currency(Currency.valueOf(
                        record.get("Currency").toUpperCase(Locale.ROOT)
                ))
                .date(record.get("Date"))
                .remark(record.get("Remark"))
                .build();
    }


    /**
     * Convert CSV row into a map using CSV headers.
     */
    private Map<String, String> toRecordMap(
            List<String> headers,
            List<String> row) {

        Map<String, String> record = new LinkedHashMap<>();

        for (int i = 0; i < headers.size(); i++) {
            record.put(headers.get(i), row.get(i));
        }

        return record;
    }


    /**
     * Internal CSV data structure.
     */
    private record CsvData(
            List<String> headers,
            List<List<String>> rows
    ) {
    }

}
