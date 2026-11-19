package com.local.dashboard.enumz;

public enum Currency {
    USDC("USDC", "USD Standard Cent"),
    USD("USD", "USD Standard"),
    KHR("KHR", "KHR Standard")
    ;

    private final String currency;
    private final String description;

    Currency(String currency, String description) {
        this.currency = currency;
        this.description = description;
    }

    public String getCurrency() {
        return currency;
    }

    public String getDescription() {
        return description;
    }
}
