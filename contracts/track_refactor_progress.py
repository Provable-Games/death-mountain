#!/usr/bin/env python3
"""
Test Refactoring Progress Tracker

This script helps track the progress of migrating tests from inline locations
to the dedicated test directory structure.
"""

import json
import os
import re
from datetime import datetime
from pathlib import Path


class TestRefactorTracker:
    def __init__(self, tracking_file="test_refactor_tracking.json"):
        self.tracking_file = tracking_file
        self.data = self.load_tracking_data()
        
    def load_tracking_data(self):
        """Load existing tracking data or create default."""
        if os.path.exists(self.tracking_file):
            with open(self.tracking_file, 'r') as f:
                return json.load(f)
        return None
    
    def save_tracking_data(self):
        """Save tracking data to file."""
        self.data['last_updated'] = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        with open(self.tracking_file, 'w') as f:
            json.dump(self.data, f, indent=2)
    
    def count_tests_in_file(self, filepath):
        """Count #[test] functions in a Cairo file."""
        if not os.path.exists(filepath):
            return 0
        
        with open(filepath, 'r') as f:
            content = f.read()
        
        # Count #[test] attributes
        test_pattern = r'#\[test\]'
        return len(re.findall(test_pattern, content))
    
    def update_file_migration(self, phase, filename, tests_migrated):
        """Update progress for a specific file migration."""
        if phase in self.data['progress']:
            phase_data = self.data['progress'][phase]
            
            # Move from remaining to completed
            if filename in phase_data['remaining_files']:
                phase_data['remaining_files'].remove(filename)
                phase_data['completed_files'].append(filename)
            
            # Update test counts
            self.data['test_counts']['migrated'] += tests_migrated
            self.data['test_counts']['remaining'] -= tests_migrated
            
            # Update phase status
            if not phase_data['remaining_files']:
                phase_data['status'] = 'completed'
            elif phase_data['completed_files']:
                phase_data['status'] = 'in_progress'
            
            self.save_tracking_data()
    
    def verify_migrated_tests(self, source_file, target_file):
        """Verify that test count matches between source and target."""
        source_tests = self.count_tests_in_file(source_file)
        target_tests = self.count_tests_in_file(target_file)
        
        match = source_tests == target_tests
        if match:
            self.data['test_counts']['verified'] += target_tests
        
        return {
            'source_file': source_file,
            'target_file': target_file,
            'source_tests': source_tests,
            'target_tests': target_tests,
            'match': match
        }
    
    def get_progress_summary(self):
        """Get a summary of current progress."""
        total = self.data['refactor_plan']['total_tests']
        migrated = self.data['test_counts']['migrated']
        verified = self.data['test_counts']['verified']
        
        summary = {
            'total_tests': total,
            'migrated': migrated,
            'verified': verified,
            'progress_percentage': round((migrated / total) * 100, 2),
            'phases': {}
        }
        
        for phase, data in self.data['progress'].items():
            if 'status' in data:
                summary['phases'][phase] = {
                    'status': data['status'],
                    'completed': len(data.get('completed_files', [])),
                    'remaining': len(data.get('remaining_files', []))
                }
        
        return summary
    
    def check_source_tests(self):
        """Check current test counts in source files."""
        results = {}
        
        # Unit tests
        unit_sources = {
            'src/models/adventurer/adventurer.cairo': 94,
            'src/models/adventurer/equipment.cairo': 32,
            'src/models/adventurer/stats.cairo': 27,
            'src/models/adventurer/bag.cairo': 15,
            'src/models/adventurer/item.cairo': 7,
            'src/models/combat.cairo': 18,
            'src/models/loot.cairo': 17,
            'src/models/beast.cairo': 17,
            'src/models/market.cairo': 10,
            'src/models/obstacle.cairo': 5,
            'src/utils/loot.cairo': 8,
            'src/utils/renderer/renderer_utils.cairo': 1
        }
        
        # Integration tests
        integration_sources = {
            'src/systems/game/contracts.cairo': 31
        }
        
        all_sources = {**unit_sources, **integration_sources}
        
        for filepath, expected in all_sources.items():
            actual = self.count_tests_in_file(filepath)
            results[filepath] = {
                'expected': expected,
                'actual': actual,
                'match': expected == actual
            }
        
        return results
    
    def print_progress(self):
        """Print a formatted progress report."""
        summary = self.get_progress_summary()
        
        print("=" * 60)
        print("TEST REFACTORING PROGRESS")
        print("=" * 60)
        print(f"Total Tests: {summary['total_tests']}")
        print(f"Migrated: {summary['migrated']} ({summary['progress_percentage']}%)")
        print(f"Verified: {summary['verified']}")
        print(f"Remaining: {summary['total_tests'] - summary['migrated']}")
        print("\nPhase Status:")
        print("-" * 40)
        
        for phase, status in summary['phases'].items():
            print(f"{phase}: {status['status']}")
            print(f"  Completed: {status['completed']} files")
            print(f"  Remaining: {status['remaining']} files")
        
        print("=" * 60)


def main():
    """Main function for CLI usage."""
    import argparse
    
    parser = argparse.ArgumentParser(description='Track test refactoring progress')
    parser.add_argument('action', choices=['status', 'verify', 'update', 'check'],
                       help='Action to perform')
    parser.add_argument('--phase', help='Phase to update (phase_1, phase_2, etc)')
    parser.add_argument('--file', help='File being migrated')
    parser.add_argument('--tests', type=int, help='Number of tests migrated')
    parser.add_argument('--source', help='Source file for verification')
    parser.add_argument('--target', help='Target file for verification')
    
    args = parser.parse_args()
    
    tracker = TestRefactorTracker()
    
    if args.action == 'status':
        tracker.print_progress()
    
    elif args.action == 'check':
        results = tracker.check_source_tests()
        print("\nSource File Test Counts:")
        print("-" * 60)
        for filepath, data in results.items():
            status = "✓" if data['match'] else "✗"
            print(f"{status} {filepath}")
            print(f"  Expected: {data['expected']}, Actual: {data['actual']}")
    
    elif args.action == 'update':
        if not all([args.phase, args.file, args.tests]):
            print("Error: --phase, --file, and --tests are required for update")
            return
        
        tracker.update_file_migration(args.phase, args.file, args.tests)
        print(f"Updated: {args.file} ({args.tests} tests migrated)")
        tracker.print_progress()
    
    elif args.action == 'verify':
        if not all([args.source, args.target]):
            print("Error: --source and --target are required for verify")
            return
        
        result = tracker.verify_migrated_tests(args.source, args.target)
        print(f"\nVerification Result:")
        print(f"Source: {result['source_file']} ({result['source_tests']} tests)")
        print(f"Target: {result['target_file']} ({result['target_tests']} tests)")
        print(f"Match: {'✓' if result['match'] else '✗'}")


if __name__ == "__main__":
    main()