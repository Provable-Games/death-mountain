// SPDX-License-Identifier: MIT
//
// @title String Utilities - Optimized Pattern Matching and String Operations
// @notice High-performance string search and manipulation functions for Cairo
// @dev Optimized algorithms for efficient pattern matching in ByteArray data
// @author Built for the Loot Survivor ecosystem

/// @notice Converts u8 value to string representation for display in SVG
/// @dev Handles edge case of zero and builds string digit by digit
/// @param value The u8 value to convert to string
/// @return ByteArray containing the string representation
pub fn u8_to_string(value: u8) -> ByteArray {
    if value == 0 {
        return "0";
    }

    let mut result = "";
    let mut val: u256 = value.into();
    let mut digits: Array<u8> = array![];

    while val > 0 {
        let digit = (val % 10).try_into().unwrap();
        digits.append(digit + 48); // Convert to ASCII
        val = val / 10;
    };

    let mut i = digits.len();
    while i > 0 {
        i -= 1;
        result.append_byte(*digits.at(i));
    };

    result
}

/// @notice Converts u64 value to string representation for display in SVG
/// @dev Handles edge case of zero and builds string digit by digit
/// @param value The u64 value to convert to string
/// @return ByteArray containing the string representation
pub fn u64_to_string(value: u64) -> ByteArray {
    if value == 0 {
        return "0";
    }

    let mut result = "";
    let mut val: u256 = value.into();
    let mut digits: Array<u8> = array![];

    while val > 0 {
        let digit = (val % 10).try_into().unwrap();
        digits.append(digit + 48); // Convert ASCII
        val = val / 10;
    };

    let mut i = digits.len();
    while i > 0 {
        i -= 1;
        result.append_byte(*digits.at(i));
    };

    result
}

/// @notice Converts u256 value to string representation for display
/// @dev Handles large numbers efficiently, builds string digit by digit
/// @param value The u256 value to convert to string
/// @return ByteArray containing the string representation
pub fn u256_to_string(value: u256) -> ByteArray {
    if value == 0 {
        return "0";
    }

    let mut result = "";
    let mut val = value;
    let mut digits: Array<u8> = array![];

    while val > 0 {
        let digit = (val % 10).try_into().unwrap();
        digits.append(digit + 48); // Convert to ASCII
        val = val / 10;
    };

    let mut i = digits.len();
    while i > 0 {
        i -= 1;
        result.append_byte(*digits.at(i));
    };

    result
}

/// @notice Converts felt252 value to ByteArray string representation
/// @dev Extracts bytes from felt252 and builds string, skipping null bytes
/// @param value The felt252 value to convert (typically item names from database)
/// @return ByteArray containing the string representation
pub fn felt252_to_string(value: felt252) -> ByteArray {
    // Cairo felt252 values that represent strings are directly convertible to ByteArray
    // Most felt252 string constants in the item database are stored as string literals
    let mut result = "";

    // Handle the zero case
    if value == 0 {
        return "";
    }

    // Convert felt252 to u256 first for bit manipulation
    let val_u256: u256 = value.into();
    let mut temp_val = val_u256;
    let mut bytes: Array<u8> = array![];

    // Extract bytes from the u256 value
    while temp_val > 0 {
        let byte = (temp_val % 256).try_into().unwrap();
        if byte != 0 { // Skip null bytes
            bytes.append(byte);
        }
        temp_val = temp_val / 256;
    };

    // Reverse the bytes since we extracted them in reverse order
    let mut i = bytes.len();
    while i > 0 {
        i -= 1;
        result.append_byte(*bytes.at(i));
    };

    result
}

// Get the character length of a felt252 string
pub fn felt252_length(value: felt252) -> u32 {
    // Handle the zero case
    if value == 0 {
        return 0;
    }

    // Convert felt252 to u256 first for bit manipulation
    let val_u256: u256 = value.into();
    let mut temp_val = val_u256;
    let mut length: u32 = 0;

    // Count non-zero bytes
    while temp_val > 0 {
        let byte = (temp_val % 256).try_into().unwrap();
        if byte != 0 { // Skip null bytes
            length += 1;
        }
        temp_val = temp_val / 256;
    };

    length
}

/// @notice Optimized pattern matching function with dual-strategy approach
/// @dev Uses naive search for short patterns (≤4 chars) and optimized search for longer patterns
/// @param haystack The ByteArray to search within
/// @param needle The pattern to search for
/// @return bool True if pattern is found, false otherwise
pub fn contains_pattern(haystack: @ByteArray, needle: @ByteArray) -> bool {
    if needle.len() == 0 {
        return true;
    }
    if haystack.len() < needle.len() {
        return false;
    }

    // For short patterns, use naive search (more efficient for small patterns)
    if needle.len() <= 4 {
        return naive_search(haystack, needle);
    }

    // For longer patterns, use optimized search with skip table
    optimized_search(haystack, needle)
}

/// @notice Naive string search algorithm for short patterns
/// @dev Simple character-by-character comparison, optimal for patterns ≤4 characters
/// @param haystack The ByteArray to search within
/// @param needle The pattern to search for
/// @return bool True if pattern is found, false otherwise
fn naive_search(haystack: @ByteArray, needle: @ByteArray) -> bool {
    let mut i = 0;
    let result = loop {
        if i > haystack.len() - needle.len() {
            break false;
        }
        let mut match_found = true;
        let mut j = 0;
        while j < needle.len() {
            if haystack[i + j] != needle[j] {
                match_found = false;
                break;
            }
            j += 1;
        };
        if match_found {
            break true;
        }
        i += 1;
    };
    result
}

/// @notice Optimized pattern search using first/last character matching heuristic
/// @dev Implements a simplified Boyer-Moore-like approach for better performance
/// @param haystack The ByteArray to search within
/// @param needle The pattern to search for
/// @return bool True if pattern is found, false otherwise
fn optimized_search(haystack: @ByteArray, needle: @ByteArray) -> bool {
    // Simple optimization: check first and last character before full match
    let first_char = needle[0];
    let last_char = needle[needle.len() - 1];

    let mut i = 0;
    let result = loop {
        if i > haystack.len() - needle.len() {
            break false;
        }
        // Quick check: first and last characters must match
        if haystack[i] == first_char && haystack[i + needle.len() - 1] == last_char {
            // Now check the full pattern
            let mut match_found = true;
            let mut j = 1; // Skip first char since we already checked it
            while j < needle.len() - 1 { // Skip last char since we already checked it
                if haystack[i + j] != needle[j] {
                    match_found = false;
                    break;
                }
                j += 1;
            };
            if match_found {
                break true;
            }
        }
        i += 1;
    };
    result
}

/// @notice Check if a ByteArray starts with a specific pattern
/// @dev Efficient prefix matching for validation and parsing
/// @param text The ByteArray to check
/// @param prefix The pattern that should appear at the start
/// @return bool True if text starts with prefix, false otherwise
pub fn starts_with_pattern(text: @ByteArray, prefix: @ByteArray) -> bool {
    if prefix.len() > text.len() {
        return false;
    }
    let mut i = 0;
    let result = loop {
        if i >= prefix.len() {
            break true;
        }
        if text[i] != prefix[i] {
            break false;
        }
        i += 1;
    };
    result
}

/// @notice Check if a ByteArray ends with a specific pattern
/// @dev Efficient suffix matching for validation and parsing
/// @param text The ByteArray to check
/// @param suffix The pattern that should appear at the end
/// @return bool True if text ends with suffix, false otherwise
pub fn ends_with_pattern(text: @ByteArray, suffix: @ByteArray) -> bool {
    if suffix.len() > text.len() {
        return false;
    }
    let start_pos = text.len() - suffix.len();
    let mut i = 0;
    let result = loop {
        if i >= suffix.len() {
            break true;
        }
        if text[start_pos + i] != suffix[i] {
            break false;
        }
        i += 1;
    };
    result
}

/// @notice Compare two ByteArrays for exact equality
/// @dev Efficient byte-by-byte comparison with early exit optimization
/// @param a First ByteArray to compare
/// @param b Second ByteArray to compare
/// @return bool True if ByteArrays are identical, false otherwise
pub fn byte_array_eq(a: @ByteArray, b: @ByteArray) -> bool {
    if a.len() != b.len() {
        return false;
    }
    let mut i = 0;
    let result = loop {
        if i >= a.len() {
            break true;
        }
        if a[i] != b[i] {
            break false;
        }
        i += 1;
    };
    result
}

/// @notice Validate that a ByteArray contains only digit characters (0-9)
/// @dev Useful for validating numeric string conversions
/// @param text The ByteArray to validate
/// @return bool True if all characters are digits, false otherwise
pub fn is_all_digits(text: @ByteArray) -> bool {
    if text.len() == 0 {
        return false;
    }
    let mut i = 0;
    let result = loop {
        if i >= text.len() {
            break true;
        }
        let byte = text[i];
        if byte < 48 || byte > 57 { // ASCII '0' = 48, '9' = 57
            break false;
        }
        i += 1;
    };
    result
}

/// @notice Count occurrences of a specific byte in a ByteArray
/// @dev Useful for counting specific characters like padding or separators
/// @param haystack The ByteArray to search within
/// @param needle The byte value to count
/// @return u32 Number of occurrences found
pub fn count_byte_occurrences(haystack: @ByteArray, needle: u8) -> u32 {
    let mut count = 0;
    let mut i = 0;
    while i < haystack.len() {
        if haystack[i] == needle {
            count += 1;
        }
        i += 1;
    };
    count
}

/// @notice Check if a ByteArray contains a specific byte value
/// @dev Fast single-byte search with early exit optimization
/// @param haystack The ByteArray to search within
/// @param needle The byte value to find
/// @return bool True if byte is found, false otherwise
pub fn contains_byte(haystack: @ByteArray, needle: u8) -> bool {
    let mut i = 0;
    let result = loop {
        if i >= haystack.len() {
            break false;
        }
        if haystack[i] == needle {
            break true;
        }
        i += 1;
    };
    result
}
