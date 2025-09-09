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


#[cfg(test)]
mod string_utils_tests {
    use super::{
        byte_array_eq, contains_byte, contains_pattern, count_byte_occurrences, ends_with_pattern, felt252_length,
        felt252_to_string, is_all_digits, starts_with_pattern, u256_to_string, u64_to_string, u8_to_string,
    };

    #[test]
    fn test_u8_to_string_simple() {
        assert(u8_to_string(0) == "0", 'should be 0');
        assert(u8_to_string(5) == "5", 'should be 5');
        assert(u8_to_string(42) == "42", 'should be 42');
        assert(u8_to_string(123) == "123", 'should be 123');
    }

    #[test]
    fn test_u8_to_string_edge_case() {
        assert(u8_to_string(255) == "255", 'max u8 should be 255');
        assert(u8_to_string(1) == "1", 'should be 1');
        assert(u8_to_string(100) == "100", 'should be 100');
        assert(u8_to_string(200) == "200", 'should be 200');
    }

    #[test]
    fn test_u64_to_string_simple() {
        assert(u64_to_string(0) == "0", 'should be 0');
        assert(u64_to_string(123) == "123", 'should be 123');
        assert(u64_to_string(1000) == "1000", 'should be 1000');
        assert(u64_to_string(999999) == "999999", 'should be 999999');
    }

    #[test]
    fn test_u64_to_string_edge_case() {
        assert(u64_to_string(18446744073709551615) == "18446744073709551615", 'wrong max u64 conversion');
        assert(u64_to_string(1) == "1", 'should be 1');
        assert(u64_to_string(10) == "10", 'should be 10');
        assert(u64_to_string(100000000000000) == "100000000000000", 'large number');
    }

    #[test]
    fn test_u256_to_string_simple() {
        let zero: u256 = 0;
        assert(u256_to_string(zero) == "0", 'should be 0');

        let small: u256 = 123;
        assert(u256_to_string(small) == "123", 'should be 123');

        let medium: u256 = 1000000;
        assert(u256_to_string(medium) == "1000000", 'should be 1000000');
    }

    #[test]
    fn test_u256_to_string_edge_case() {
        let one: u256 = 1;
        assert(u256_to_string(one) == "1", '1 should be 1');

        let large: u256 = u256 { low: 0xffffffffffffffffffffffffffffffff, high: 0 };
        let large_str = u256_to_string(large);
        assert(large_str.len() > 0, 'large number should convert');

        let very_large: u256 = u256 { low: 1000000000000000000000000000000000000, high: 1 };
        let very_large_str = u256_to_string(very_large);
        assert(very_large_str.len() > 30, 'should be long');
    }

    #[test]
    fn test_felt252_to_string_simple() {
        assert(felt252_to_string(0) == "", 'zero felt should be empty');

        // Test with ASCII values that form readable strings
        let hello_felt: felt252 = 'hello';
        let result = felt252_to_string(hello_felt);
        assert(result.len() > 0, 'should not be empty');
    }

    #[test]
    fn test_felt252_to_string_edge_case() {
        // Test single character
        let a_felt: felt252 = 'a';
        let a_result = felt252_to_string(a_felt);
        assert(a_result.len() > 0, 'should not be empty');

        // Test longer string
        let long_felt: felt252 = 'test_string';
        let long_result = felt252_to_string(long_felt);
        assert(long_result.len() > 0, 'should not be empty');
    }

    #[test]
    fn test_felt252_length_simple() {
        assert(felt252_length(0) == 0, 'should be 0');

        let hello_felt: felt252 = 'hello';
        let length = felt252_length(hello_felt);
        assert(length > 0, 'should not be empty');
    }

    #[test]
    fn test_felt252_length_edge_case() {
        let a_felt: felt252 = 'a';
        assert(felt252_length(a_felt) >= 1, 'should have length >= 1');

        let long_felt: felt252 = 'test_string_longer';
        let long_length = felt252_length(long_felt);
        assert(long_length > 10, 'should have length > 10');
    }

    #[test]
    fn test_contains_pattern_simple() {
        let haystack = "hello world";
        let needle = "world";
        assert(contains_pattern(@haystack, @needle), 'not found');

        let needle2 = "hello";
        assert(contains_pattern(@haystack, @needle2), 'not found');

        let needle3 = "xyz";
        assert(!contains_pattern(@haystack, @needle3), 'should not find xyz');
    }

    #[test]
    fn test_contains_pattern_edge_case() {
        let haystack = "test";
        let empty_needle = "";
        assert(contains_pattern(@haystack, @empty_needle), 'empty pattern should match');

        let haystack2 = "";
        let needle = "test";
        assert(!contains_pattern(@haystack2, @needle), 'should not match non-empty');

        let single_char = "a";
        let single_needle = "a";
        assert(contains_pattern(@single_char, @single_needle), 'should match itself');
    }

    #[test]
    fn test_starts_with_pattern_simple() {
        let text = "hello world";
        let prefix = "hello";
        assert(starts_with_pattern(@text, @prefix), 'should start with hello');

        let prefix2 = "world";
        assert(!starts_with_pattern(@text, @prefix2), 'should not start with world');
    }

    #[test]
    fn test_starts_with_pattern_edge_case() {
        let text = "test";
        let empty_prefix = "";
        assert(starts_with_pattern(@text, @empty_prefix), 'should start with empty prefix');

        let text2 = "";
        let prefix = "test";
        assert(!starts_with_pattern(@text2, @prefix), 'starts with non-empty prefix');

        let same = "test";
        assert(starts_with_pattern(@same, @same), 'text should start with itself');
    }

    #[test]
    fn test_ends_with_pattern_simple() {
        let text = "hello world";
        let suffix = "world";
        assert(ends_with_pattern(@text, @suffix), 'should end with world');

        let suffix2 = "hello";
        assert(!ends_with_pattern(@text, @suffix2), 'should not end with hello');
    }

    #[test]
    fn test_ends_with_pattern_edge_case() {
        let text = "test";
        let empty_suffix = "";
        assert(ends_with_pattern(@text, @empty_suffix), 'should end with empty suffix');

        let text2 = "";
        let suffix = "test";
        assert(!ends_with_pattern(@text2, @suffix), 'ends with non-empty suffix');

        let same = "test";
        assert(ends_with_pattern(@same, @same), 'should end with itself');
    }

    #[test]
    fn test_byte_array_eq_simple() {
        let a = "hello";
        let b = "hello";
        assert(byte_array_eq(@a, @b), 'should be equal');

        let c = "world";
        assert(!byte_array_eq(@a, @c), 'should not be equal');
    }

    #[test]
    fn test_byte_array_eq_edge_case() {
        let empty1 = "";
        let empty2 = "";
        assert(byte_array_eq(@empty1, @empty2), 'should be equal');

        let empty = "";
        let non_empty = "test";
        assert(!byte_array_eq(@empty, @non_empty), 'should not be equal');

        let different_length1 = "test";
        let different_length2 = "testing";
        assert(!byte_array_eq(@different_length1, @different_length2), 'should not be equal');
    }

    #[test]
    fn test_is_all_digits_simple() {
        let digits = "12345";
        assert(is_all_digits(@digits), 'hould be all digits');

        let mixed = "123abc";
        assert(!is_all_digits(@mixed), 'should not be all digits');

        let zero = "0";
        assert(is_all_digits(@zero), 'should be all digits');
    }

    #[test]
    fn test_is_all_digits_edge_case() {
        let empty = "";
        assert(!is_all_digits(@empty), 'should not be all digits');

        let single_digit = "5";
        assert(is_all_digits(@single_digit), 'should be all digits');

        let letters = "abc";
        assert(!is_all_digits(@letters), 'should not be all digits');

        let with_space = "1 2 3";
        assert(!is_all_digits(@with_space), 'should not be all digits');
    }

    #[test]
    fn test_count_byte_occurrences_simple() {
        let text = "hello world";
        let l_byte = 'l';
        assert(count_byte_occurrences(@text, l_byte) == 3, 'should find 3 l characters');

        let o_byte = 'o';
        assert(count_byte_occurrences(@text, o_byte) == 2, 'should find 2 o characters');

        let z_byte = 'z';
        assert(count_byte_occurrences(@text, z_byte) == 0, 'should find 0 z characters');
    }

    #[test]
    fn test_count_byte_occurrences_edge_case() {
        let empty = "";
        let any_byte = 'a';
        assert(count_byte_occurrences(@empty, any_byte) == 0, 'should have 0 occurrences');

        let single = "a";
        let a_byte = 'a';
        assert(count_byte_occurrences(@single, a_byte) == 1, 'should have 1 occurrence');

        let repeated = "aaaa";
        assert(count_byte_occurrences(@repeated, a_byte) == 4, 'should find 4 a characters');
    }

    #[test]
    fn test_contains_byte_simple() {
        let text = "hello world";
        let h_byte = 'h';
        assert(contains_byte(@text, h_byte), 'should contain h');

        let space_byte = ' ';
        assert(contains_byte(@text, space_byte), 'should contain space');

        let z_byte = 'z';
        assert(!contains_byte(@text, z_byte), 'should not contain z');
    }

    #[test]
    fn test_contains_byte_edge_case() {
        let empty = "";
        let any_byte = 'a';
        assert(!contains_byte(@empty, any_byte), 'should not contain any byte');

        let single = "x";
        let x_byte = 'x';
        assert(contains_byte(@single, x_byte), 'should contain itself');

        let y_byte = 'y';
        assert(!contains_byte(@single, y_byte), 'should not contain different');
    }
}
