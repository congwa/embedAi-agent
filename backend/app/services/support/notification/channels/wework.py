"""企业微信通知渠道

通过企业微信应用消息 API 发送通知。
文档：https://developer.work.weixin.qq.com/document/path/90236
"""

import time
from typing import Any

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger
from app.services.support.notification.base import (
    BaseNotificationChannel,
    NotificationPayload,
    NotificationResult,
)

logger = get_logger("notification.wework")


class WeWorkChannel(BaseNotificationChannel):
    """企业微信通知渠道
    
    配置项（.env）：
    - WEWORK_CORP_ID: 企业 ID
    - WEWORK_AGENT_ID: 应用 ID
    - WEWORK_AGENT_SECRET: 应用 Secret
    - WEWORK_NOTIFY_USERS: 接收通知的用户（逗号分隔，如 "admin1,admin2"）
    """

    _access_token: str | None = None
    _token_expires_at: float = 0

    @property
    def channel_name(self) -> str:
        return "wework"

    def is_enabled(self) -> bool:
        """检查企业微信配置是否完整"""
        settings = get_settings()
        return bool(
            getattr(settings, "WEWORK_CORP_ID", None)
            and getattr(settings, "WEWORK_AGENT_ID", None)
            and getattr(settings, "WEWORK_AGENT_SECRET", None)
        )

    async def _get_access_token(self) -> str | None:
        """获取 access_token（带缓存）"""
        now = time.time()

        if self._access_token and now < self._token_expires_at - 60:
            return self._access_token

        settings = get_settings()
        corp_id = getattr(settings, "WEWORK_CORP_ID", "")
        secret = getattr(settings, "WEWORK_AGENT_SECRET", "")

        url = "https://qyapi.weixin.qq.com/cgi-bin/gettoken"
        params = {"corpid": corp_id, "corpsecret": secret}

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.get(url, params=params)
                data = resp.json()

            if data.get("errcode") == 0:
                self._access_token = data["access_token"]
                self._token_expires_at = now + data.get("expires_in", 7200)
                logger.debug("获取企业微信 access_token 成功")
                return self._access_token
            else:
                logger.error(
                    "获取企业微信 access_token 失败",
                    errcode=data.get("errcode"),
                    errmsg=data.get("errmsg"),
                )
                return None

        except Exception as e:
            logger.exception("获取企业微信 access_token 异常", error=str(e))
            return None

    async def send(self, payload: NotificationPayload) -> NotificationResult:
        """发送企业微信应用消息"""
        if not self.is_enabled():
            return NotificationResult(
                success=False,
                channel=self.channel_name,
                error="企业微信未配置",
            )

        access_token = await self._get_access_token()
        if not access_token:
            return NotificationResult(
                success=False,
                channel=self.channel_name,
                error="获取 access_token 失败",
            )

        settings = get_settings()
        agent_id = getattr(settings, "WEWORK_AGENT_ID", "")
        notify_users = getattr(settings, "WEWORK_NOTIFY_USERS", "@all")

        message_content = self.format_message(payload)

        url = f"https://qyapi.weixin.qq.com/cgi-bin/message/send?access_token={access_token}"
        body: dict[str, Any] = {
            "touser": notify_users,
            "msgtype": "text",
            "agentid": int(agent_id),
            "text": {"content": message_content},
        }

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(url, json=body)
                data = resp.json()

            if data.get("errcode") == 0:
                logger.info(
                    "企业微信通知发送成功",
                    conversation_id=payload.conversation_id,
                    msgid=data.get("msgid"),
                )
                return NotificationResult(
                    success=True,
                    channel=self.channel_name,
                    message_id=data.get("msgid"),
                    raw_response=data,
                )
            else:
                logger.error(
                    "企业微信通知发送失败",
                    errcode=data.get("errcode"),
                    errmsg=data.get("errmsg"),
                )
                return NotificationResult(
                    success=False,
                    channel=self.channel_name,
                    error=data.get("errmsg"),
                    raw_response=data,
                )

        except Exception as e:
            logger.exception("企业微信通知发送异常", error=str(e))
            return NotificationResult(
                success=False,
                channel=self.channel_name,
                error=str(e),
            )
