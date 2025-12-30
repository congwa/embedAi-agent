"""Webhook 通知渠道

通用 Webhook 推送，可对接任意支持 HTTP POST 的系统。
"""

from typing import Any

import httpx

from app.core.config import get_settings
from app.core.logging import get_logger
from app.services.support.notification.base import (
    BaseNotificationChannel,
    NotificationPayload,
    NotificationResult,
)

logger = get_logger("notification.webhook")


class WebhookChannel(BaseNotificationChannel):
    """Webhook 通知渠道
    
    配置项（.env）：
    - NOTIFY_WEBHOOK_URL: Webhook URL
    - NOTIFY_WEBHOOK_SECRET: 可选的签名密钥
    """

    @property
    def channel_name(self) -> str:
        return "webhook"

    def is_enabled(self) -> bool:
        """检查 Webhook 配置是否完整"""
        settings = get_settings()
        return bool(getattr(settings, "NOTIFY_WEBHOOK_URL", None))

    async def send(self, payload: NotificationPayload) -> NotificationResult:
        """发送 Webhook 通知"""
        if not self.is_enabled():
            return NotificationResult(
                success=False,
                channel=self.channel_name,
                error="Webhook 未配置",
            )

        settings = get_settings()
        webhook_url = getattr(settings, "NOTIFY_WEBHOOK_URL", "")

        body: dict[str, Any] = {
            "type": payload.type.value,
            "conversation_id": payload.conversation_id,
            "user_id": payload.user_id,
            "title": payload.title,
            "message_preview": payload.message_preview,
            "entry_page": payload.entry_page,
            "console_url": payload.console_url,
            "extra": payload.extra,
            "created_at": payload.created_at.isoformat(),
        }

        headers: dict[str, str] = {
            "Content-Type": "application/json",
        }

        secret = getattr(settings, "NOTIFY_WEBHOOK_SECRET", None)
        if secret:
            import hashlib
            import hmac
            import json

            payload_str = json.dumps(body, sort_keys=True)
            signature = hmac.new(
                secret.encode(),
                payload_str.encode(),
                hashlib.sha256,
            ).hexdigest()
            headers["X-Signature"] = signature

        try:
            async with httpx.AsyncClient(timeout=10) as client:
                resp = await client.post(webhook_url, json=body, headers=headers)

            if resp.status_code < 400:
                logger.info(
                    "Webhook 通知发送成功",
                    conversation_id=payload.conversation_id,
                    status_code=resp.status_code,
                )
                return NotificationResult(
                    success=True,
                    channel=self.channel_name,
                    raw_response={"status_code": resp.status_code},
                )
            else:
                logger.error(
                    "Webhook 通知发送失败",
                    status_code=resp.status_code,
                    response=resp.text[:200],
                )
                return NotificationResult(
                    success=False,
                    channel=self.channel_name,
                    error=f"HTTP {resp.status_code}",
                    raw_response={"status_code": resp.status_code, "body": resp.text[:500]},
                )

        except Exception as e:
            logger.exception("Webhook 通知发送异常", error=str(e))
            return NotificationResult(
                success=False,
                channel=self.channel_name,
                error=str(e),
            )
