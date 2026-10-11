/**
 * RunwayOS — standalone finance-engine test runner.
 * Run with: npm test
 */
import { runAllTests } from './financeEngine.test';

const result = runAllTests();
for (const line of result.results) {
  console.log(line);
}
console.log(`\nFinance engine tests: ${result.passed} passed, ${result.failed} failed.`);

if (result.failed > 0) {
  process.exitCode = 1;
}
