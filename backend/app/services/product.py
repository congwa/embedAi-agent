"""商品服务"""

from sqlalchemy.ext.asyncio import AsyncSession

from app.models.product import Product
from app.repositories.product import ProductRepository
from app.schemas.product import ProductCreate


class ProductService:
    """商品服务"""

    def __init__(self, session: AsyncSession):
        self.repo = ProductRepository(session)

    async def get_all_products(self) -> list[Product]:
        """获取所有商品"""
        return await self.repo.get_all()

    async def get_product(self, product_id: str) -> Product | None:
        """获取单个商品"""
        return await self.repo.get_by_id(product_id)

    async def create_or_update_product(self, product_data: ProductCreate) -> Product:
        """创建或更新商品"""
        return await self.repo.upsert_product(
            product_id=product_data.id,
            name=product_data.name,
            summary=product_data.summary,
            description=product_data.description,
            price=product_data.price,
            category=product_data.category,
            url=product_data.url,
        )

    async def get_products_by_category(self, category: str) -> list[Product]:
        """根据分类获取商品"""
        return await self.repo.get_by_category(category)
