"""数据库迁移脚本: 添加在线状态和消息已读字段

运行方式:
    cd backend
    python scripts/migrate_v2_presence.py

此脚本添加以下字段:
- messages 表: is_delivered, delivered_at, read_at, read_by
- conversations 表: user_online, user_last_online_at, agent_online, agent_last_online_at, current_agent_id
"""

import sqlite3
import sys
from pathlib import Path

# 添加项目根目录到 path
sys.path.insert(0, str(Path(__file__).parent.parent))

from app.core.config import settings


def migrate():
    """执行迁移"""
    db_path = settings.DATABASE_PATH
    
    if not Path(db_path).exists():
        print(f"数据库文件不存在: {db_path}")
        print("新数据库将在应用启动时自动创建新结构")
        return
    
    print(f"正在迁移数据库: {db_path}")
    
    conn = sqlite3.connect(db_path)
    cursor = conn.cursor()
    
    try:
        # 检查并添加 messages 表的新字段
        print("\n检查 messages 表...")
        cursor.execute("PRAGMA table_info(messages)")
        existing_cols = {row[1] for row in cursor.fetchall()}
        
        messages_new_cols = [
            ("is_delivered", "BOOLEAN DEFAULT 0 NOT NULL"),
            ("delivered_at", "DATETIME"),
            ("read_at", "DATETIME"),
            ("read_by", "VARCHAR(100)"),
        ]
        
        for col_name, col_def in messages_new_cols:
            if col_name not in existing_cols:
                sql = f"ALTER TABLE messages ADD COLUMN {col_name} {col_def}"
                print(f"  添加列: {col_name}")
                cursor.execute(sql)
            else:
                print(f"  列已存在: {col_name}")
        
        # 检查并添加 conversations 表的新字段
        print("\n检查 conversations 表...")
        cursor.execute("PRAGMA table_info(conversations)")
        existing_cols = {row[1] for row in cursor.fetchall()}
        
        conversations_new_cols = [
            ("user_online", "BOOLEAN DEFAULT 0 NOT NULL"),
            ("user_last_online_at", "DATETIME"),
            ("agent_online", "BOOLEAN DEFAULT 0 NOT NULL"),
            ("agent_last_online_at", "DATETIME"),
            ("current_agent_id", "VARCHAR(100)"),
        ]
        
        for col_name, col_def in conversations_new_cols:
            if col_name not in existing_cols:
                sql = f"ALTER TABLE conversations ADD COLUMN {col_name} {col_def}"
                print(f"  添加列: {col_name}")
                cursor.execute(sql)
            else:
                print(f"  列已存在: {col_name}")
        
        conn.commit()
        print("\n迁移完成!")
        
    except Exception as e:
        conn.rollback()
        print(f"\n迁移失败: {e}")
        raise
    finally:
        conn.close()


if __name__ == "__main__":
    migrate()
