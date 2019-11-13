module.exports = {
  redisHost: process.env.REDIS_HOST,
  redisPort: process.env.REDIS_PORT
};

// Anytime we want to connect to redis we are going to connect to the host name(url)
// And the port we are exposing to connect to redis
