// SPDX-License-Identifier: MIT
//
// @title Base64 Encoding Utilities for On-Chain SVG Generation
// @notice Gas-optimized Base64 encoding functions for converting SVG and JSON to data URIs
// @dev Efficient implementation designed for Cairo's byte handling and gas optimization
// @author Built for the Loot Survivor ecosystem

use core::num::traits::Bounded;

/// @notice Returns the standard Base64 character set for encoding operations
/// @dev Inline function for gas optimization, returns alphabet A-Z, a-z, 0-9, +, /
/// @return Span<u8> containing the 64 Base64 characters as ASCII bytes
#[inline(always)]
pub fn get_base64_char_set() -> Span<u8> {
    let mut result = array![
        'A',
        'B',
        'C',
        'D',
        'E',
        'F',
        'G',
        'H',
        'I',
        'J',
        'K',
        'L',
        'M',
        'N',
        'O',
        'P',
        'Q',
        'R',
        'S',
        'T',
        'U',
        'V',
        'W',
        'X',
        'Y',
        'Z',
        'a',
        'b',
        'c',
        'd',
        'e',
        'f',
        'g',
        'h',
        'i',
        'j',
        'k',
        'l',
        'm',
        'n',
        'o',
        'p',
        'q',
        'r',
        's',
        't',
        'u',
        'v',
        'w',
        'x',
        'y',
        'z',
        '0',
        '1',
        '2',
        '3',
        '4',
        '5',
        '6',
        '7',
        '8',
        '9',
        '+',
        '/',
    ];
    result.span()
}

/// @notice Public interface for Base64 encoding of ByteArray data
/// @dev Main function used by metadata generation to encode SVG and JSON data
/// @param _bytes The ByteArray data to encode (SVG content, JSON metadata, etc.)
/// @return Base64-encoded ByteArray suitable for data URI inclusion
pub fn bytes_base64_encode(_bytes: ByteArray) -> ByteArray {
    encode_bytes(_bytes, get_base64_char_set())
}


/// @notice Core Base64 encoding implementation with padding support
/// @dev Handles byte grouping, padding, and character mapping for RFC 4648 compliance
/// @param bytes The input ByteArray to encode (may be modified for padding)
/// @param base64_chars The character set to use for encoding
/// @return Base64-encoded ByteArray with proper padding ('=' characters)
fn encode_bytes(mut bytes: ByteArray, base64_chars: Span<u8>) -> ByteArray {
    let mut result: ByteArray = "";
    if bytes.len() == 0 {
        return result;
    }
    let mut p: u8 = 0;
    let c = bytes.len() % 3;
    if c == 1 {
        p = 2;
        bytes.append_byte(0_u8);
        bytes.append_byte(0_u8);
    } else if c == 2 {
        p = 1;
        bytes.append_byte(0_u8);
    }

    let mut i = 0;
    let bytes_len = bytes.len();
    let last_iteration = bytes_len - 3;
    loop {
        if i == bytes_len {
            break;
        }
        let n: u32 = (bytes.at(i).unwrap()).into()
            * 65536 | (bytes.at(i + 1).unwrap()).into()
            * 256 | (bytes.at(i + 2).unwrap()).into();
        let e1 = (n / 262144) & 63;
        let e2 = (n / 4096) & 63;
        let e3 = (n / 64) & 63;
        let e4 = n & 63;

        if i == last_iteration {
            if p == 2 {
                result.append_byte(*base64_chars[e1]);
                result.append_byte(*base64_chars[e2]);
                result.append_byte('=');
                result.append_byte('=');
            } else if p == 1 {
                result.append_byte(*base64_chars[e1]);
                result.append_byte(*base64_chars[e2]);
                result.append_byte(*base64_chars[e3]);
                result.append_byte('=');
            } else {
                result.append_byte(*base64_chars[e1]);
                result.append_byte(*base64_chars[e2]);
                result.append_byte(*base64_chars[e3]);
                result.append_byte(*base64_chars[e4]);
            }
        } else {
            result.append_byte(*base64_chars[e1]);
            result.append_byte(*base64_chars[e2]);
            result.append_byte(*base64_chars[e3]);
            result.append_byte(*base64_chars[e4]);
        }

        i += 3;
    };
    result
}

pub trait BytesUsedTrait<T> {
    /// Returns the number of bytes used to represent a `T` value.
    /// # Arguments
    /// * `self` - The value to check.
    /// # Returns
    /// The number of bytes used to represent the value.
    fn bytes_used(self: T) -> u8;
}

pub impl U8BytesUsedTraitImpl of BytesUsedTrait<u8> {
    fn bytes_used(self: u8) -> u8 {
        if self == 0 {
            return 0;
        }

        return 1;
    }
}

pub impl USizeBytesUsedTraitImpl of BytesUsedTrait<usize> {
    fn bytes_used(self: usize) -> u8 {
        if self < 0x10000 { // 256^2
            if self < 0x100 { // 256^1
                if self == 0 {
                    return 0;
                } else {
                    return 1;
                };
            }
            return 2;
        } else {
            if self < 0x1000000 { // 256^3
                return 3;
            }
            return 4;
        }
    }
}

pub impl U64BytesUsedTraitImpl of BytesUsedTrait<u64> {
    fn bytes_used(self: u64) -> u8 {
        if self <= Bounded::<u32>::MAX.into() { // 256^4
            return BytesUsedTrait::<u32>::bytes_used(self.try_into().unwrap());
        } else {
            if self < 0x1000000000000 { // 256^6
                if self < 0x10000000000 { // 256^5
                    if self < 0x100000000 { // 256^4
                        return 4;
                    }
                    return 5;
                }
                return 6;
            } else {
                if self < 0x100000000000000 { // 256^7
                    return 7;
                } else {
                    return 8;
                }
            }
        }
    }
}


pub impl U128BytesUsedTraitImpl of BytesUsedTrait<u128> {
    fn bytes_used(self: u128) -> u8 {
        if self <= Bounded::<u64>::MAX.into() { // 256^8
            return BytesUsedTrait::<u64>::bytes_used(self.try_into().unwrap());
        } else {
            if self < 0x1000000000000000000000000 { // 256^12
                if self < 0x100000000000000000000 { // 256^10
                    if self < 0x1000000000000000000 { // 256^9
                        return 9;
                    }
                    return 10;
                }
                if self < 0x10000000000000000000000 { // 256^11
                    return 11;
                }
                return 12;
            } else {
                if self < 0x10000000000000000000000000000 { // 256^14
                    if self < 0x100000000000000000000000000 { // 256^13
                        return 13;
                    }
                    return 14;
                } else {
                    if self < 0x1000000000000000000000000000000 { // 256^15
                        return 15;
                    }
                    return 16;
                }
            }
        }
    }
}

pub impl U256BytesUsedTraitImpl of BytesUsedTrait<u256> {
    fn bytes_used(self: u256) -> u8 {
        if self.high == 0 {
            return BytesUsedTrait::<u128>::bytes_used(self.low.try_into().unwrap());
        } else {
            return BytesUsedTrait::<u128>::bytes_used(self.high.try_into().unwrap()) + 16;
        }
    }
}
