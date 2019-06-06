/* eslint-env mocha */
const {readFileSync} = require('fs');
const {isAbsolute, join} = require('path');

const BN = require('bn.js')
const {expect} = require('chai');
const yaml = require('js-yaml');

const camelcaseObj = require('./camelcaseObj');
const ETH_SCHEMA = require('./yaml/schema');

/**
 * Run yaml Eth2.0 spec tests for a certain function
 * Compares actual vs expected for all test cases
 * @param {string} testYamlPath - path to yaml spec test
 * @param {Function} testFunc - function to use to generate output
 * @param {Function} getInput - function to convert test case into input array
 * @param {Function} getExpected - function to convert test case into a
 *   comparable expected output
 * @param {Function} getActual - function to convert function output into
 *   comparable actual output
 * @param {Function} shouldError - function to convert test case into a
 *   boolean, if the case should result in an error
 * @param {Function} shouldSkip - function to convert test case into a boolean,
 *   if the case should be skipped
 * @param {Function} expectFunc - function to run expectations against expected
 *   and actual output
 * @param timeout - how long to wait before marking tests as failed (default 2000ms). Set to 0 to wait infinitely
 */
function describeSpecTest(
  testYamlPath,
  testFunc,
  getInput = (testCase) => testCase.input,
  getExpected = (testCase) => testCase.output,
  getActual = (result) => result,
  shouldError = (testCase, index, testSpec) => false,
  shouldSkip = (testCase, index, testSpec) => false,
  expectFunc = (testCase, expect, expected, actual) => expect(actual).to.be.equal(expected),
  timeout = 2000
) {
  const testSpec = camelcaseObj(yaml.load(
    readFileSync(
      testYamlPath,
      'utf8'
    ), {
      schema: ETH_SCHEMA,
    }), {
    deep: true
  });

  describe(`${testSpec.runner} - ${testFunc.name} - ${testSpec.title}`, function() {

    this.timeout(timeout);

    testSpec.testCases.forEach((testCase, index) => {
      if (shouldSkip(testCase, index, testSpec)) {
        return;
      }
      const description = index + (testCase.description ? ' - ' + testCase.description : '');
      it(description, function () {
        const inputs = getInput(testCase);
        if (shouldError(testCase, index, testSpec)) {
          expect(testFunc.bind(null, ...inputs)).to.throw();
        } else {
          const result = testFunc(...inputs);
          const actual = getActual(result);
          const expected = getExpected(testCase);
          expectFunc(testCase, expect, expected, actual);
        }
      });
    });
  });
}

module.exports = {
  describeSpecTest
};