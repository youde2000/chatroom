from tortoise import Tortoise
from app.core.config import settings
from app.models import TORTOISE_ORM

async def init_db():
    await Tortoise.init(
        db_url=settings.DATABASE_URL,
        modules={"models": ["app.models"]}
    )
    await Tortoise.generate_schemas()

async def close_db():
    await Tortoise.close_connections() 