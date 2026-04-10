package com.truelens.backend.model;

public enum PredictionResult {

    REAL,
    FAKE,
    // FIX #9: Added UNCERTAIN so the ML service's third possible label is stored
    // correctly instead of silently falling through to FAKE.
    UNCERTAIN
}
