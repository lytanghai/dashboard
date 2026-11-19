package com.local.dashboard.enumz;

public enum Status {
    IN_PROGRESS("IN_PROGRESS"),
    COMPLETED("COMPLETED"),
    ;

    private String value;

    Status(String value) {
        this.value = value;
    }
}
