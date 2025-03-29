import { SearchHistory } from '../types';

class SearchHistoryService {
    private readonly STORAGE_KEY = 'search_history';
    private readonly MAX_HISTORY = 10;

    getHistory(): SearchHistory[] {
        const history = localStorage.getItem(this.STORAGE_KEY);
        return history ? JSON.parse(history) : [];
    }

    addHistory(text: string, type: 'chatroom' | 'user'): void {
        const history = this.getHistory();
        const newItem: SearchHistory = {
            id: Date.now().toString(),
            text,
            type,
            timestamp: Date.now()
        };

        // 删除重复项
        const filteredHistory = history.filter(item => item.text !== text || item.type !== type);
        
        // 添加新项到开头
        filteredHistory.unshift(newItem);

        // 保持历史记录不超过最大数量
        if (filteredHistory.length > this.MAX_HISTORY) {
            filteredHistory.pop();
        }

        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredHistory));
    }

    clearHistory(): void {
        localStorage.removeItem(this.STORAGE_KEY);
    }

    deleteItem(id: string): void {
        const history = this.getHistory();
        const filteredHistory = history.filter(item => item.id !== id);
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(filteredHistory));
    }
}

export const searchHistoryService = new SearchHistoryService(); 