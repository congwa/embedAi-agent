"""FastAPI 应用入口"""

from collections.abc import AsyncGenerator
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.core.logging import logger
from app.routers import chat, conversations, users
from app.services.agent.agent import agent_service


@asynccontextmanager
async def lifespan(app: FastAPI) -> AsyncGenerator[None, None]:
    """应用生命周期管理"""
    # 启动时配置日志（确保最先执行）
    logger.configure()
    
    logger.info("启动应用...", module="app")
    settings.ensure_data_dir()
    await init_db()
    logger.info("应用启动完成", module="app", host=settings.API_HOST, port=settings.API_PORT)
    
    yield
    
    logger.info("正在关闭应用...", module="app")
    await agent_service.close()
    logger.info("应用已关闭", module="app")


app = FastAPI(
    title="商品推荐 Agent",
    description="基于 LangChain v1.1 的智能商品推荐系统",
    version="0.1.0",
    lifespan=lifespan,
)

# CORS 配置
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(chat.router)
app.include_router(conversations.router)
app.include_router(users.router)


@app.get("/health")
async def health_check():
    """健康检查"""
    return {"status": "ok", "version": "0.1.0"}


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=True,
    )
