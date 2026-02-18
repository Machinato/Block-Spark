module.exports = {
  skipFiles: ['mocks/', 'test/'],
  istanbulReporter: ['html', 'lcov', 'text-summary'],
  providerOptions: {
    defaultBlockGasLimit: 30000000
  },
  skipFiles: ['mocks/RejectETH.sol']
};