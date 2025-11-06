'''
Business: Send and retrieve encrypted messages between users
Args: event with httpMethod (GET/POST), queryStringParameters or body
Returns: HTTP response with messages or success status
'''

import json
import os
from typing import Dict, Any, List
import psycopg2
from psycopg2.extras import RealDictCursor

def get_db_connection():
    database_url = os.environ.get('DATABASE_URL')
    return psycopg2.connect(database_url)

def handler(event: Dict[str, Any], context: Any) -> Dict[str, Any]:
    method: str = event.get('httpMethod', 'GET')
    
    if method == 'OPTIONS':
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
                'Access-Control-Allow-Headers': 'Content-Type, X-Auth-Token',
                'Access-Control-Max-Age': '86400'
            },
            'body': '',
            'isBase64Encoded': False
        }
    
    conn = get_db_connection()
    cur = conn.cursor(cursor_factory=RealDictCursor)
    
    try:
        if method == 'GET':
            params = event.get('queryStringParameters') or {}
            username = params.get('username')
            other_user = params.get('other_user')
            
            if not username:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Username required'}),
                    'isBase64Encoded': False
                }
            
            if other_user:
                cur.execute("""
                    SELECT id, sender_username, recipient_username, message_text, encrypted, created_at
                    FROM messages
                    WHERE (sender_username = %s AND recipient_username = %s)
                       OR (sender_username = %s AND recipient_username = %s)
                    ORDER BY created_at ASC
                """, (username, other_user, other_user, username))
            else:
                cur.execute("""
                    SELECT DISTINCT ON (other_user) 
                        other_user,
                        message_text as last_message,
                        created_at as last_message_time
                    FROM (
                        SELECT 
                            CASE 
                                WHEN sender_username = %s THEN recipient_username
                                ELSE sender_username
                            END as other_user,
                            message_text,
                            created_at
                        FROM messages
                        WHERE sender_username = %s OR recipient_username = %s
                    ) conversations
                    ORDER BY other_user, created_at DESC
                """, (username, username, username))
            
            messages = cur.fetchall()
            
            messages_list = []
            for msg in messages:
                msg_dict = dict(msg)
                if 'created_at' in msg_dict and msg_dict['created_at']:
                    msg_dict['created_at'] = msg_dict['created_at'].isoformat()
                if 'last_message_time' in msg_dict and msg_dict['last_message_time']:
                    msg_dict['last_message_time'] = msg_dict['last_message_time'].isoformat()
                messages_list.append(msg_dict)
            
            return {
                'statusCode': 200,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'messages': messages_list}),
                'isBase64Encoded': False
            }
        
        elif method == 'POST':
            body_data = json.loads(event.get('body', '{}'))
            action = body_data.get('action')
            
            if action == 'send':
                sender = body_data.get('sender_username', '').strip()
                recipient = body_data.get('recipient_username', '').strip()
                message_text = body_data.get('message_text', '').strip()
                
                if not sender or not recipient or not message_text:
                    return {
                        'statusCode': 400,
                        'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                        'body': json.dumps({'error': 'Sender, recipient and message_text required'}),
                        'isBase64Encoded': False
                    }
                
                cur.execute(
                    """INSERT INTO messages (sender_username, recipient_username, message_text, encrypted) 
                       VALUES (%s, %s, %s, true) 
                       RETURNING id, sender_username, recipient_username, message_text, encrypted, created_at""",
                    (sender, recipient, message_text)
                )
                new_message = cur.fetchone()
                conn.commit()
                
                msg_dict = dict(new_message)
                if 'created_at' in msg_dict and msg_dict['created_at']:
                    msg_dict['created_at'] = msg_dict['created_at'].isoformat()
                
                return {
                    'statusCode': 201,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'success': True, 'message': msg_dict}),
                    'isBase64Encoded': False
                }
            
            elif action == 'get_users':
                search_query = body_data.get('search', '').strip()
                current_user = body_data.get('current_user', '').strip()
                
                if search_query:
                    cur.execute(
                        """SELECT username, last_seen FROM users 
                           WHERE username ILIKE %s AND username != %s 
                           ORDER BY username LIMIT 50""",
                        (f'%{search_query}%', current_user)
                    )
                else:
                    cur.execute(
                        """SELECT username, last_seen FROM users 
                           WHERE username != %s 
                           ORDER BY last_seen DESC LIMIT 50""",
                        (current_user,)
                    )
                
                users = cur.fetchall()
                users_list = []
                for user in users:
                    user_dict = dict(user)
                    if 'last_seen' in user_dict and user_dict['last_seen']:
                        user_dict['last_seen'] = user_dict['last_seen'].isoformat()
                    users_list.append(user_dict)
                
                return {
                    'statusCode': 200,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'users': users_list}),
                    'isBase64Encoded': False
                }
            
            else:
                return {
                    'statusCode': 400,
                    'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                    'body': json.dumps({'error': 'Invalid action'}),
                    'isBase64Encoded': False
                }
        
        else:
            return {
                'statusCode': 405,
                'headers': {'Content-Type': 'application/json', 'Access-Control-Allow-Origin': '*'},
                'body': json.dumps({'error': 'Method not allowed'}),
                'isBase64Encoded': False
            }
    
    finally:
        cur.close()
        conn.close()
