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
