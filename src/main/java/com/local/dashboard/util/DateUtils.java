package com.local.dashboard.util;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;

public class DateUtils {

    private static final String FORMAT_DATE_V1 = "yyyy-MM-dd";
    private static final String FORMAT_DATE_V2 = "yyyy-MM";

    public static String formatYMD() {
        LocalDate localDate = LocalDate.now();

        return localDate.format(
                DateTimeFormatter.ofPattern(FORMAT_DATE_V1)
        );
    }

    public static String formatYM() {
        LocalDate localDate = LocalDate.now();

        return localDate.format(
                DateTimeFormatter.ofPattern(FORMAT_DATE_V2)
        );
    }

    public static String formatDateTime(String input) {
        LocalDateTime dateTime = LocalDateTime.parse(input);
        return dateTime.format(DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm:ss"));
    }
}
