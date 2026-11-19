package com.local.dashboard.enumz;

public enum Category {

    UTILITIES("UTILITIES","Electricity, water, gas, and household bills"),
    INTERNET("INTERNET","Home broadband internet and mobile data plans"),
    TRADING("TRADING","Stock, Crypto, or financial trading transactions"),
    FOOD("FOOD","Meals, groceries, coffee, and dining out"),
    SALARY("SALARY","Regular employment income, wages, and bonuses"),
    TRANSPORTATION("TRANSPORTATION","Fuel and parking"),
    ENTERTAINMENT("ENTERTAINMENT"," Events and hobbies"),
    OTHER("OTHER","Uncategorized transactions");
    ;

    private final String name;

    private final String description;

    Category(String name, String description) {
        this.name = name;
        this.description = description;
    }

    public String getName() {
        return name;
    }

    public String getDescription() {
        return description;
    }
}
