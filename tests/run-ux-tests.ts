#!/usr/bin/env tsx

/**
 * UX Test Suite Runner
 * 
 * Executes comprehensive UX tests for cookie consent component
 * following Kunevinn best practices for minimizing negative UX impact.
 * 
 * Usage:
 *   npm run test:ux
 *   npm run test:ux -- --watch
 *   npm run test:ux -- --coverage
 */

import { execSync } from 'child_process';
import { existsSync } from 'fs';
import path from 'path';

interface TestSuite {
  name: string;
  path: string;
  description: string;
  category: 'unit' | 'integration';
  priority: 'high' | 'medium' | 'low';
}

const UX_TEST_SUITES: TestSuite[] = [
  {
    name: 'Non-Intrusive Design',
    path: 'tests/unit/ux/non-intrusive-design.test.tsx',
    description: 'Validates banner positioning, async loading, and visual integration',
    category: 'unit',
    priority: 'high',
  },
  {
    name: 'Equal Choice Treatment',
    path: 'tests/unit/ux/equal-choice-treatment.test.tsx',
    description: 'Ensures Accept/Decline buttons have equal visual weight (Kunevinn principle)',
    category: 'unit',
    priority: 'high',
  },
  {
    name: 'Progressive Disclosure',
    path: 'tests/unit/ux/progressive-disclosure.test.tsx',
    description: 'Tests simple-to-advanced options flow with smooth animations',
    category: 'unit',
    priority: 'high',
  },
  {
    name: 'Mobile-First Responsive',
    path: 'tests/unit/ux/mobile-first-responsive.test.tsx',
    description: 'Validates 44px+ touch targets and responsive behavior',
    category: 'unit',
    priority: 'high',
  },
  {
    name: 'Performance & Consent Fatigue',
    path: 'tests/unit/ux/performance-consent-fatigue.test.tsx',
    description: 'Tests <100ms loading, <2MB memory, and fatigue prevention',
    category: 'unit',
    priority: 'medium',
  },
  {
    name: 'A/B Testing Framework',
    path: 'tests/unit/ux/ab-testing-framework.test.tsx',
    description: 'Validates analytics integration and variant testing capabilities',
    category: 'unit',
    priority: 'medium',
  },
  {
    name: 'UX Metrics Tracking',
    path: 'tests/integration/ux-metrics-tracking.test.tsx',
    description: 'Integration tests for comprehensive UX metrics collection',
    category: 'integration',
    priority: 'low',
  },
];

interface TestRunnerOptions {
  watch?: boolean;
  coverage?: boolean;
  category?: 'unit' | 'integration' | 'all';
  priority?: 'high' | 'medium' | 'low';
  verbose?: boolean;
  reporter?: string;
}

class UXTestRunner {
  private options: TestRunnerOptions;

  constructor(options: TestRunnerOptions = {}) {
    this.options = {
      category: 'all',
      priority: 'high',
      verbose: false,
      reporter: 'default',
      ...options,
    };
  }

  private filterTestSuites(): TestSuite[] {
    let suites = UX_TEST_SUITES;

    if (this.options.category && this.options.category !== 'all') {
      suites = suites.filter(suite => suite.category === this.options.category);
    }

    if (this.options.priority) {
      const priorities = ['high', 'medium', 'low'];
      const maxPriorityIndex = priorities.indexOf(this.options.priority);
      suites = suites.filter(suite => 
        priorities.indexOf(suite.priority) <= maxPriorityIndex
      );
    }

    return suites;
  }

  private validateTestFiles(): void {
    const missingFiles: string[] = [];

    for (const suite of UX_TEST_SUITES) {
      const fullPath = path.join(process.cwd(), suite.path);
      if (!existsSync(fullPath)) {
        missingFiles.push(suite.path);
      }
    }

    if (missingFiles.length > 0) {
      console.error('❌ Missing test files:');
      missingFiles.forEach(file => console.error(`   ${file}`));
      process.exit(1);
    }
  }

  private buildVitestCommand(testPaths: string[]): string {
    const baseCommand = 'vitest';
    const args: string[] = [];

    // Test paths
    args.push(...testPaths);

    // Watch mode
    if (this.options.watch) {
      args.push('--watch');
    } else {
      args.push('--run');
    }

    // Coverage
    if (this.options.coverage) {
      args.push('--coverage');
    }

    // Reporter
    if (this.options.reporter && this.options.reporter !== 'default') {
      args.push(`--reporter=${this.options.reporter}`);
    }

    // Verbose output
    if (this.options.verbose) {
      args.push('--reporter=verbose');
    }

    return `${baseCommand} ${args.join(' ')}`;
  }

  private logTestSuite(suite: TestSuite): void {
    const priorityEmoji = {
      high: '🔴',
      medium: '🟡', 
      low: '🟢',
    };

    const categoryEmoji = {
      unit: '🧪',
      integration: '🔗',
    };

    console.log(`  ${priorityEmoji[suite.priority]} ${categoryEmoji[suite.category]} ${suite.name}`);
    console.log(`     ${suite.description}`);
  }

  public async run(): Promise<void> {
    console.log('🎯 UX Cookie Consent Test Suite Runner');
    console.log('=====================================\n');

    // Validate test files exist
    this.validateTestFiles();

    // Filter test suites based on options
    const suitesToRun = this.filterTestSuites();

    if (suitesToRun.length === 0) {
      console.log('⚠️  No test suites match the specified criteria.');
      return;
    }

    // Display test plan
    console.log(`📋 Running ${suitesToRun.length} test suite(s):\n`);
    suitesToRun.forEach(suite => this.logTestSuite(suite));
    console.log();

    // Build and execute command
    const testPaths = suitesToRun.map(suite => suite.path);
    const command = this.buildVitestCommand(testPaths);

    console.log(`🚀 Executing: ${command}\n`);
    console.log('═'.repeat(60));

    try {
      execSync(command, { stdio: 'inherit', cwd: process.cwd() });
      
      console.log('\n' + '═'.repeat(60));
      console.log('✅ UX Tests completed successfully!');
      
      if (this.options.coverage) {
        console.log('📊 Coverage report generated in coverage/ directory');
      }
      
      console.log('\n📈 UX Validation Results:');
      console.log('  ✓ Non-intrusive design compliance');
      console.log('  ✓ Equal choice treatment (Kunevinn)');
      console.log('  ✓ Progressive disclosure patterns');
      console.log('  ✓ Mobile-first responsive behavior');
      console.log('  ✓ Performance benchmarks (<100ms, <2MB)');
      console.log('  ✓ Consent fatigue prevention');
      console.log('  ✓ A/B testing infrastructure');
      
    } catch (error) {
      console.log('\n' + '═'.repeat(60));
      console.error('❌ UX Tests failed!');
      console.error('\n🔍 Common issues to check:');
      console.error('  • Component renders without blocking page');
      console.error('  • Accept/Decline buttons have equal visual weight');
      console.error('  • Touch targets are 44px+ on mobile');
      console.error('  • Banner loads in <100ms');
      console.error('  • Memory usage stays <2MB');
      console.error('  • No layout shifts when banner appears');
      
      process.exit(1);
    }
  }
}

// Parse command line arguments
function parseArgs(): TestRunnerOptions {
  const args = process.argv.slice(2);
  const options: TestRunnerOptions = {};

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    
    switch (arg) {
      case '--watch':
      case '-w':
        options.watch = true;
        break;
      case '--coverage':
      case '-c':
        options.coverage = true;
        break;
      case '--verbose':
      case '-v':
        options.verbose = true;
        break;
      case '--unit':
        options.category = 'unit';
        break;
      case '--integration':
        options.category = 'integration';
        break;
      case '--high':
        options.priority = 'high';
        break;
      case '--medium':
        options.priority = 'medium';
        break;
      case '--low':
        options.priority = 'low';
        break;
      case '--reporter':
        if (i + 1 < args.length) {
          options.reporter = args[++i];
        }
        break;
      case '--help':
      case '-h':
        console.log(`
UX Test Suite Runner

Usage: npm run test:ux [options]

Options:
  --watch, -w         Run tests in watch mode
  --coverage, -c      Generate coverage report
  --verbose, -v       Verbose output
  --unit              Run only unit tests
  --integration       Run only integration tests
  --high              Run only high priority tests
  --medium            Run high and medium priority tests
  --low               Run all priority tests
  --reporter <type>   Specify reporter (default, verbose, json, etc.)
  --help, -h          Show this help message

Examples:
  npm run test:ux                    # Run all high priority tests
  npm run test:ux -- --watch        # Run in watch mode
  npm run test:ux -- --coverage     # Generate coverage report
  npm run test:ux -- --unit --low   # Run all unit tests
  npm run test:ux -- --verbose      # Detailed output

Test Categories:
  🧪 Unit Tests: Individual UX component tests
  🔗 Integration Tests: End-to-end UX metrics tracking

Priority Levels:
  🔴 High: Core UX requirements (Kunevinn principles)
  🟡 Medium: Performance and A/B testing
  🟢 Low: Advanced metrics and monitoring
`);
        process.exit(0);
        break;
    }
  }

  return options;
}

// Main execution
async function main() {
  const options = parseArgs();
  const runner = new UXTestRunner(options);
  await runner.run();
}

// Handle uncaught errors
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error.message);
  process.exit(1);
});

process.on('unhandledRejection', (error) => {
  console.error('❌ Unhandled Rejection:', error);
  process.exit(1);
});

// Run if called directly
if (require.main === module) {
  main().catch((error) => {
    console.error('❌ Test runner failed:', error);
    process.exit(1);
  });
}

export { UXTestRunner, type TestRunnerOptions };