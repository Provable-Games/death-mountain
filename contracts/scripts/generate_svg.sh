#!/bin/bash

# ========================================================================
# Death Mountain Renderer - SVG Generator Script
# ========================================================================
# This script generates SVG and PNG outputs for adventurer states in Death Mountain
# Normal State: Adventurer alive and not in combat (health > 0, beast_health = 0)
# Death State: Adventurer dead (health = 0)
# 
# The script extracts SVGs from test output and converts them to PNG format

set -e

OUTPUT_DIR="output"
TEMP_DIR=$(mktemp -d)

# Create directories
mkdir -p "$OUTPUT_DIR"
mkdir -p "$TEMP_DIR"

echo "⚔️  Death Mountain Renderer - SVG Generator"
echo "=========================================="

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

echo -e "${BLUE}📋 Generating SVG outputs for Death Mountain adventurer states...${NC}"

# Function to extract SVG from test output
extract_svg_from_test() {
    local test_name="$1"
    local state_name="$2"
    local output_file="$3"
    
    echo -e "${YELLOW}   Running test: $test_name${NC}"
    
    # Run the test and capture output
    sozo test --filter "$test_name" 2>&1 | \
        sed -n "/=== $state_name ===/,/=== END $state_name ===/p" | \
        sed '1d;$d' > "$output_file"
    
    if [ -s "$output_file" ]; then
        echo -e "${GREEN}   ✓ SVG extracted successfully${NC}"
        return 0
    else
        echo -e "${RED}   ✗ Failed to extract SVG${NC}"
        return 1
    fi
}

# Function to convert SVG to PNG using various methods
convert_svg_to_png() {
    local svg_file="$1"
    local png_file="$2"
    
    echo -e "${YELLOW}   Converting SVG to PNG...${NC}"
    
    # Try multiple conversion methods
    if command -v inkscape >/dev/null 2>&1; then
        echo -e "${BLUE}   Using Inkscape for conversion${NC}"
        inkscape "$svg_file" --export-type=png --export-filename="$png_file" --export-width=862 --export-height=1270
    elif command -v rsvg-convert >/dev/null 2>&1; then
        echo -e "${BLUE}   Using rsvg-convert for conversion${NC}"
        rsvg-convert -w 862 -h 1270 "$svg_file" -o "$png_file"
    elif command -v convert >/dev/null 2>&1; then
        echo -e "${BLUE}   Using ImageMagick convert for conversion${NC}"
        convert -background none -size 862x1270 "$svg_file" "$png_file"
    else
        echo -e "${YELLOW}   ⚠️  No SVG converter found. PNG generation skipped.${NC}"
        echo -e "${YELLOW}   Install inkscape, librsvg2-bin, or imagemagick for PNG conversion${NC}"
        return 1
    fi
    
    if [ -f "$png_file" ]; then
        echo -e "${GREEN}   ✓ PNG converted successfully${NC}"
        return 0
    else
        echo -e "${RED}   ✗ PNG conversion failed${NC}"
        return 1
    fi
}

echo ""
echo -e "${BLUE}🔧 Building Cairo project...${NC}"
sozo build
if [ $? -ne 0 ]; then
    echo -e "${RED}❌ Build failed${NC}"
    exit 1
fi
echo -e "${GREEN}✓ Build successful${NC}"

# Function to generate state outputs
generate_state_outputs() {
    local state_name="$1"
    local state_display="$2"
    local test_function="$3"
    
    echo ""
    echo -e "${BLUE}⚰️  $state_display${NC}"
    echo "================================"
    
    if extract_svg_from_test "$test_function" "$state_name" "$TEMP_DIR/$state_name.svg"; then
        local filename_base="$(echo $state_name | tr '[:upper:]' '[:lower:]' | tr ' ' '_')"
        cp "$TEMP_DIR/$state_name.svg" "$OUTPUT_DIR/${filename_base}.svg"
        
        # Convert to PNG
        convert_svg_to_png "$OUTPUT_DIR/${filename_base}.svg" "$OUTPUT_DIR/${filename_base}.png"
        
        echo -e "${GREEN}✓ $state_display outputs generated${NC}"
        return 0
    else
        echo -e "${RED}❌ Failed to generate $state_display outputs${NC}"
        return 1
    fi
}

# Generate Normal State (alive adventurer)
generate_state_outputs "NORMAL STATE SVG" "Normal State (Alive Adventurer)" "test_output_normal_state_svg"

# Generate Death State (dead adventurer)  
generate_state_outputs "DEATH STATE SVG" "Death State (Dead Adventurer)" "test_output_death_state_svg"

# Generate Battle State (alive adventurer in combat)
generate_state_outputs "BATTLE STATE SVG" "Battle State (Adventurer In Combat)" "test_output_battle_state_svg"

# Generate Death In Battle State (dead adventurer, beast still alive)
generate_state_outputs "DEATH IN BATTLE SVG" "Death In Battle State (Died During Combat)" "test_output_death_in_battle_svg"

echo ""
echo -e "${BLUE}📊 Generating size comparison...${NC}"

# Run size comparison test
echo -e "${YELLOW}Running size comparison test...${NC}"
sozo test --filter test_svg_size_comparison 2>&1 | \
    sed -n "/=== SVG SIZE COMPARISON ===/,/=== END COMPARISON ===/p" | \
    sed '1d;$d' > "$OUTPUT_DIR/size_comparison.txt"

if [ -s "$OUTPUT_DIR/size_comparison.txt" ]; then
    echo -e "${GREEN}✓ Size comparison generated${NC}"
    echo ""
    echo -e "${BLUE}📏 Size Comparison Results:${NC}"
    cat "$OUTPUT_DIR/size_comparison.txt"
else
    echo -e "${YELLOW}⚠️  Size comparison unavailable${NC}"
fi

# Cleanup
rm -rf "$TEMP_DIR"

echo ""
echo -e "${GREEN}🎉 Generation complete!${NC}"
echo -e "${BLUE}📁 Output files created in: ${OUTPUT_DIR}/${NC}"
echo ""
echo "Generated files:"
echo "├── normal_state_svg.svg           - Normal state SVG (Alive adventurer)"
echo "├── normal_state_svg.png           - Normal state PNG (Alive adventurer)"
echo "├── death_state_svg.svg            - Death state SVG (Dead adventurer)"
echo "├── death_state_svg.png            - Death state PNG (Dead adventurer)"
echo "├── battle_state_svg.svg           - Battle state SVG (Adventurer in combat)"
echo "├── battle_state_svg.png           - Battle state PNG (Adventurer in combat)"
echo "├── death_in_battle_svg.svg        - Death in battle SVG (Died during combat)"
echo "├── death_in_battle_svg.png        - Death in battle PNG (Died during combat)"
echo "└── size_comparison.txt            - Size comparison stats"
echo ""
echo -e "${BLUE}⚔️  Adventurer States:${NC}"
echo "• Normal State: Adventurer is alive (health > 0) and not in combat"
echo "• Death State: Adventurer is dead (health = 0) - shows death page only"
echo "• Battle State: Adventurer is alive (health > 0) and in combat (beast_health > 0)"
echo "• Death In Battle: Adventurer is dead (health = 0) but beast is still alive (beast_health > 0)"
echo ""
echo -e "${BLUE}💡 Usage Tips:${NC}"
echo "• View SVG files in a browser for best quality"
echo "• PNG files are raster versions for external use"
echo "• SVGs dynamically show different layouts based on adventurer state"
echo "• Use 'open output/' on macOS or 'xdg-open output/' on Linux to view outputs"
echo ""
echo -e "${GREEN}⚔️  Happy adventuring in Death Mountain!${NC}"