package com.local.dashboard.enumz;

public enum Type {
    D("DEBIT"),
    C("CREDIT")
    ;

    private final String type;

    Type(String type) {
        this.type = type;
    }

    public String getType() {
        return type;
    }
}
