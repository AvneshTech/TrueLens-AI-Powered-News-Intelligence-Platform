package com.truelens.backend.dto;

import lombok.Data;
import lombok.Builder;

@Data
@Builder
public class AdminStats {
    private long totalUsers;
    private long totalNotes;
    private long bannedUsers;
    private String status; // ACTIVE / BANNED
}