module.exports = {
  // ...other config...
  transformIgnorePatterns: ["/node_modules/(?!axios)/"],
  transform: {
    "^.+\\.(js|jsx|ts|tsx)$": "babel-jest",
  },
  testEnvironment: "jsdom",
  moduleFileExtensions: ["ts", "tsx", "js", "jsx", "json", "node"],
}; 