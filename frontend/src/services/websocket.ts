import { Message, WebSocketMessage } from '../types';

export class WebSocketService {
    private ws: WebSocket | null = null;
    private reconnectAttempts = 0;
    private maxReconnectAttempts = 5;
    private reconnectTimeout = 3000;
    private messageHandlers: ((message: Message) => void)[] = [];
    private notificationHandlers: ((notification: any) => void)[] = [];
    private typingHandlers: ((data: { room_id: number; user_id: number; is_typing: boolean }) => void)[] = [];

    constructor(private token: string) {}

    connect() {
        const wsUrl = `${process.env.REACT_APP_WS_URL}/ws?token=${this.token}`;
        this.ws = new WebSocket(wsUrl);

        this.ws.onopen = () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
        };

        this.ws.onmessage = (event) => {
            const data = JSON.parse(event.data);
            
            switch (data.type) {
                case 'message':
                    this.messageHandlers.forEach(handler => handler(data.data));
                    break;
                case 'notification':
                    this.notificationHandlers.forEach(handler => handler(data.data));
                    break;
                case 'typing':
                    this.typingHandlers.forEach(handler => handler(data.data));
                    break;
            }
        };

        this.ws.onclose = () => {
            console.log('WebSocket disconnected');
            this.handleReconnect();
        };

        this.ws.onerror = (error) => {
            console.error('WebSocket error:', error);
        };
    }

    private handleReconnect() {
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
            this.reconnectAttempts++;
            setTimeout(() => {
                console.log(`Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})`);
                this.connect();
            }, this.reconnectTimeout);
        }
    }

    disconnect() {
        if (this.ws) {
            this.ws.close();
            this.ws = null;
        }
    }

    sendMessage(content: string, type: 'text' | 'image') {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'message',
                data: {
                    content,
                    message_type: type
                }
            }));
        }
    }

    sendTyping(isTyping: boolean) {
        if (this.ws?.readyState === WebSocket.OPEN) {
            this.ws.send(JSON.stringify({
                type: 'typing',
                data: {
                    is_typing: isTyping
                }
            }));
        }
    }

    addTypingHandler(handler: (data: { room_id: number; user_id: number; is_typing: boolean }) => void) {
        this.typingHandlers.push(handler);
        return () => {
            this.typingHandlers = this.typingHandlers.filter(h => h !== handler);
        };
    }

    onMessage(handler: (message: Message) => void) {
        this.messageHandlers.push(handler);
        return () => {
            this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
        };
    }

    onNotification(handler: (notification: any) => void) {
        this.notificationHandlers.push(handler);
        return () => {
            this.notificationHandlers = this.notificationHandlers.filter(h => h !== handler);
        };
    }

    onTyping(handler: (data: { room_id: number; user_id: number; is_typing: boolean }) => void) {
        this.typingHandlers.push(handler);
        return () => {
            this.typingHandlers = this.typingHandlers.filter(h => h !== handler);
        };
    }
} 