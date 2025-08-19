#!/bin/bash

# OSINT Tool Test Script
# This script makes it easy to test the enhanced OSINT tool with different inputs

echo "🔍 Enhanced OSINT Tool Test Script"
echo "=================================="
echo ""

# Build the project first
echo "📦 Building project..."
npm run build

if [ $? -ne 0 ]; then
    echo "❌ Build failed. Please fix compilation errors."
    exit 1
fi

echo "✅ Build successful!"
echo ""

# Function to run analysis
run_analysis() {
    local first_name="$1"
    local last_name="$2"
    local email="$3"
    local mode="$4"
    
    echo "🎯 Analyzing: $first_name $last_name ($email)"
    echo "Mode: $mode"
    echo "----------------------------------------"
    
    if [ "$mode" = "detailed" ]; then
        node dist/cli-enhanced-person-analysis.cjs "$first_name" "$last_name" "$email" --detailed
    else
        node dist/cli-enhanced-person-analysis.cjs "$first_name" "$last_name" "$email"
    fi
    
    echo ""
    echo "✅ Analysis complete for $first_name $last_name"
    echo "=========================================="
    echo ""
}

# Check if arguments were provided
if [ $# -eq 0 ]; then
    echo "📋 Usage Examples:"
    echo ""
    echo "1. Test with provided arguments:"
    echo "   ./test-osint.sh \"FirstName\" \"LastName\" \"email@domain.com\" [detailed]"
    echo ""
    echo "2. Quick test with Jed Burdick:"
    echo "   ./test-osint.sh jed"
    echo ""
    echo "3. Interactive mode (just run without arguments)"
    echo ""
    
    # Interactive mode
    echo "🔄 Enter person details for analysis:"
    echo ""
    read -p "First Name: " first_name
    read -p "Last Name: " last_name
    read -p "Email: " email
    read -p "Detailed analysis? (y/n): " detailed_choice
    
    if [ "$detailed_choice" = "y" ] || [ "$detailed_choice" = "Y" ]; then
        mode="detailed"
    else
        mode="standard"
    fi
    
    run_analysis "$first_name" "$last_name" "$email" "$mode"
    
elif [ "$1" = "jed" ]; then
    # Quick test with Jed Burdick
    echo "🚀 Running quick test with Jed Burdick..."
    run_analysis "Jed" "Burdick" "jed@votaryfilms.com" "detailed"
    
else
    # Use provided arguments
    first_name="$1"
    last_name="$2"
    email="$3"
    mode="${4:-standard}"  # Default to standard if not specified
    
    run_analysis "$first_name" "$last_name" "$email" "$mode"
fi

echo "🎉 Test script completed!"
echo ""
echo "💡 Tips:"
echo "   - Use 'detailed' mode for more comprehensive search (128 queries)"
echo "   - Standard mode uses fewer queries but is faster"
echo "   - Check the exports/ folder for detailed JSON reports"
echo "   - Each analysis generates a timestamped report file"
