module.exports = {
    target: 'node', // This tells Webpack you're bundling for Node.js and enables built-in modules like `fs`.
    entry: './convex/openai.ts',
    output: {
      path: __dirname + '/dist',
      filename: 'output.js',
    },
    // other configurations...
  };
  