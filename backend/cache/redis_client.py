import os
import redis

REDIS_URL = os.getenv(
    "REDIS_URL",
    f"rediss://:{os.getenv('REDIS_PASSWORD', '')}@{os.getenv('REDIS_HOST', 'localhost')}:{os.getenv('REDIS_PORT', 6379)}/0"
)

redis_client = redis.Redis.from_url(REDIS_URL, decode_responses=True)
