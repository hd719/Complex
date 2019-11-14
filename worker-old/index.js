const keys = require("./keys");
const redis = require("redis");

const redisClient = redis.createClient({
  host: keys.redisHost,
  port: keys.redisPort,

  // this tells redis that if it ever loses connection with our server go ahead and retry to connect to the server every 1 second
  retry_strategy: () => 1000
});

const sub = redisClient.duplicate();

// not an ideal solution (very slow)
function fib(index) {
  if (index < 2) return 1;
  return fib(index - 1) + fib(index - 2);
}

// sub: subscription watches redis for a new value
// values: everytime we get a new number(message) we are going to insert that into the hash of values
// message: is the key and the value is calculated fib(parseInt(message))
sub.on("message", (channel, message) => {
  redisClient.hset("values", message, fib(parseInt(message)));
});

// when any one tries to insert any values into redis it will this redisClient.hset("values", message, fib(parseInt(message)));
sub.subscribe("insert");
