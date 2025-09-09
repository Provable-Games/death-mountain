// SPDX-License-Identifier: MIT
//
// @title Math Utilities - Mathematical functions for renderer calculations
// @notice Core mathematical functions used throughout the renderer system
// @dev Optimized for gas efficiency and Cairo compatibility

/// @notice Maximum equipment greatness level (matching death-mountain implementation)
pub const MAX_GREATNESS: u8 = 20;

/// @notice Calculates equipment greatness/level from experience points
/// @dev Mimics death-mountain's get_greatness function using square root calculation
/// @param xp The experience points of the equipment item
/// @return Equipment level/greatness value (1-20, capped at MAX_GREATNESS)
pub fn get_greatness(xp: u16) -> u8 {
    if xp == 0 {
        1
    } else {
        // Calculate square root of xp for level
        let level = sqrt_u16(xp);
        if level > MAX_GREATNESS {
            MAX_GREATNESS
        } else {
            level
        }
    }
}

/// @notice Simple integer square root implementation for u16 values
/// @dev Uses Newton's method for efficient square root calculation, with overflow protection
/// @param value The u16 value to calculate square root of
/// @return u8 containing the integer square root
pub fn sqrt_u16(value: u16) -> u8 {
    if value == 0 {
        return 0;
    }

    // Use u32 for intermediate calculations to prevent overflow
    let mut x: u32 = value.into();
    let mut y: u32 = (x + 1) / 2;

    while y < x {
        x = y;
        let value_u32: u32 = value.into();
        y = (x + value_u32 / x) / 2;
    };

    // Cap result to u8 max if needed
    if x > 255 {
        255
    } else {
        x.try_into().unwrap()
    }
}

#[cfg(test)]
mod math_utils_tests {
    use super::{MAX_GREATNESS, get_greatness, sqrt_u16};

    #[test]
    fn test_get_greatness_zero_xp() {
        let greatness = get_greatness(0);
        assert(greatness == 1, 'zero xp should return 1');
    }

    #[test]
    fn test_get_greatness_low_xp() {
        let greatness = get_greatness(4);
        assert(greatness == 2, 'xp=4 should return 2');
    }

    #[test]
    fn test_get_greatness_medium_xp() {
        let greatness = get_greatness(100);
        assert(greatness == 10, 'xp=100 should return 10');
    }

    #[test]
    fn test_get_greatness_high_xp() {
        let greatness = get_greatness(400);
        assert(greatness == 20, 'xp=400 should return 20');
    }

    #[test]
    fn test_get_greatness_max_cap() {
        let greatness = get_greatness(10000);
        assert(greatness == 20, 'high xp should cap at 20');
    }

    #[test]
    fn test_get_greatness_max_constant() {
        assert(MAX_GREATNESS == 20, 'MAX_GREATNESS should be 20');
    }

    #[test]
    fn test_sqrt_u16_zero() {
        let result = sqrt_u16(0);
        assert(result == 0, 'sqrt(0) should be 0');
    }

    #[test]
    fn test_sqrt_u16_perfect_squares() {
        let result1 = sqrt_u16(1);
        assert(result1 == 1, 'sqrt(1) should be 1');

        let result4 = sqrt_u16(4);
        assert(result4 == 2, 'sqrt(4) should be 2');

        let result9 = sqrt_u16(9);
        assert(result9 == 3, 'sqrt(9) should be 3');

        let result16 = sqrt_u16(16);
        assert(result16 == 4, 'sqrt(16) should be 4');

        let result25 = sqrt_u16(25);
        assert(result25 == 5, 'sqrt(25) should be 5');

        let result100 = sqrt_u16(100);
        assert(result100 == 10, 'sqrt(100) should be 10');
    }

    #[test]
    fn test_sqrt_u16_non_perfect_squares() {
        let result2 = sqrt_u16(2);
        assert(result2 == 1, 'sqrt(2) should be 1 (floor)');

        let result3 = sqrt_u16(3);
        assert(result3 == 1, 'sqrt(3) should be 1 (floor)');

        let result8 = sqrt_u16(8);
        assert(result8 == 2, 'sqrt(8) should be 2 (floor)');

        let result15 = sqrt_u16(15);
        assert(result15 == 3, 'sqrt(15) should be 3 (floor)');

        let result99 = sqrt_u16(99);
        assert(result99 == 9, 'sqrt(99) should be 9 (floor)');
    }

    #[test]
    fn test_sqrt_u16_large_values() {
        let result1000 = sqrt_u16(1000);
        assert(result1000 == 31, 'sqrt(1000) should be 31');

        let result10000 = sqrt_u16(10000);
        assert(result10000 == 100, 'sqrt(10000) should be 100');

        let result65535 = sqrt_u16(65535);
        assert(result65535 == 255, 'should be 255 (max u8)');
    }
}
