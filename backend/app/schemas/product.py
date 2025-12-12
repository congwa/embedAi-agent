"""商品相关 Schema"""

from datetime import datetime

from pydantic import BaseModel, Field


class ProductCreate(BaseModel):
    """创建商品请求"""

    id: str = Field(..., description="商品 ID")
    name: str = Field(..., description="商品名称")
    summary: str | None = Field(None, description="核心卖点（100字以内）")
    description: str | None = Field(None, description="详细描述")
    price: float | None = Field(None, description="价格")
    category: str | None = Field(None, description="分类")
    url: str | None = Field(None, description="商品链接")


class ProductResponse(BaseModel):
    """商品响应"""

    id: str
    name: str
    summary: str | None
    price: float | None
    category: str | None
    url: str | None
    created_at: datetime
    updated_at: datetime

    model_config = {"from_attributes": True}


class ProductSearchResult(BaseModel):
    """商品搜索结果"""

    id: str
    name: str
    summary: str | None
    price: float | None
    url: str | None
