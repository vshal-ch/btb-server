-- KEYS = list of unit keys
-- ARGV[1] = ttlSeconds
-- ARGV[2] = value (userId or booking temp id)

-- Step 1: check
for _, key in ipairs(KEYS) do
  if redis.call("EXISTS", key) == 1 then
    return 0 -- overlap found
  end
end

-- Step 2: lock all
for _, key in ipairs(KEYS) do
  redis.call("SET", key, ARGV[2], "EX", ARGV[1])
end

return 1
