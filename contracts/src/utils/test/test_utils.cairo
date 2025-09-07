// SPDX-License-Identifier: MIT
//
// @title Test Utilities
// @notice Common validation functions and test helpers for invariant testing
// @dev Reusable utilities to ensure consistent testing patterns across the codebase

// Constants for test configuration
pub const MIN_FUZZING_RUNS: u32 = 30;
pub const MAX_FUZZING_RUNS: u32 = 100;
pub const MIN_CONTENT_LENGTH: u32 = 29;
pub const MIN_IMAGE_LENGTH: u32 = 26;
pub const MIN_SVG_LENGTH: u32 = 100;
pub const BASE_HEALTH: u32 = 100;
pub const VITALITY_MULTIPLIER: u32 = 15;
pub const MAX_VITALITY: u32 = 255;
pub const MAX_U128_BYTES: u8 = 16;
pub const MAX_U256_BYTES: u8 = 32;
pub const U256_HIGH_LOW_BOUNDARY: u32 = 16;


// Helper functions for common validations
pub fn validate_non_empty_content(content: @ByteArray, min_length: u32) {
    assert!(content.len() > min_length, "Content must have minimum length");
}

pub fn validate_health_formula(health: u16, vitality: u8) {
    let expected: u16 = (BASE_HEALTH + (vitality.into() * VITALITY_MULTIPLIER)).try_into().unwrap();
    assert!(health == expected, "Health formula must be consistent");
    assert!(health >= BASE_HEALTH.try_into().unwrap(), "Health must be at least base 100");
    assert!(
        health <= (BASE_HEALTH + (MAX_VITALITY * VITALITY_MULTIPLIER)).try_into().unwrap(),
        "Health must not exceed max",
    );
}

pub fn validate_data_uri_format(content: @ByteArray, min_length: u32) {
    assert!(content.len() > min_length, "Must have substantial content");
}

pub fn validate_svg_basic_structure(svg: @ByteArray) {
    assert!(svg.len() > MIN_SVG_LENGTH, "SVG must have substantial content");
    assert!(svg.len() > 500, "Must contain substantial SVG content");
    assert!(svg.len() > 1000, "SVG must be substantial with meaningful content");
    assert!(svg.len() > 0, "SVG should not be empty");
}

pub fn validate_base64_properties(input: @ByteArray, result: @ByteArray) {
    if input.len() == 0 {
        assert!(result.len() == 0, "Empty input must produce empty output");
    } else {
        assert!(result.len() > 0, "Non-empty input should produce output");
    }
}

pub fn validate_string_conversion_invariants(value: u256, result: @ByteArray) {
    assert!(result.len() > 0, "String conversion must never be empty");

    if value.low == 0 && value.high == 0 {
        assert!(result == @"0", "Zero must convert to 0");
    } else {
        assert!(result != @"0", "Non-zero must not convert to 0");
    }
}

pub fn validate_bytes_used_range(bytes_used: u32, max_bytes: u32) {
    assert!(bytes_used <= max_bytes, "Bytes used should not exceed maximum");
}

pub fn validate_bytes_used_zero_handling(bytes_used: u32, is_zero: bool) {
    if is_zero {
        assert!(bytes_used == 0, "Zero value must use 0 bytes");
    } else {
        assert!(bytes_used > 0, "Non-zero value must use >0 bytes");
    }
}

pub fn create_u256_from_bytes(input_value: u64) -> ByteArray {
    let mut limited_input = "";
    if input_value > 0 {
        let mut val = input_value;
        let mut bytes_to_add = 0;
        while val > 0 && bytes_to_add < 8_u32 {
            limited_input.append_byte((val % 256).try_into().unwrap());
            val = val / 256;
            bytes_to_add += 1;
        }
    }
    limited_input
}
