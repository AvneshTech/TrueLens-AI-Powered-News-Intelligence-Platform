package com.truelens.backend.dto;

import lombok.AllArgsConstructor;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@NoArgsConstructor
@AllArgsConstructor
public class StatCard {
    private String title;
    private String value;
    private String change;
    private String trend; // "up" or "down"
}