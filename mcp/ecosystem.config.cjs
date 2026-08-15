module.exports = {
  apps: [
    {
      name: "aegis-mcp-server",
      script: "./dist/index.js",
      // This tells PM2 to start Node with the native env file loader
      node_args: "--env-file=.env", 
      env: {
        NODE_ENV: "production",
        PORT: 3000
      }
    }
  ]
};
