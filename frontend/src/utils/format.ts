import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';

export const formatMessageTime = (date: string | Date): string => {
    const messageDate = new Date(date);
    const now = new Date();
    const diffInHours = Math.abs(now.getTime() - messageDate.getTime()) / (1000 * 60 * 60);

    if (diffInHours < 24) {
        return format(messageDate, 'HH:mm');
    } else if (diffInHours < 48) {
        return '昨天 ' + format(messageDate, 'HH:mm');
    } else if (diffInHours < 7 * 24) {
        return format(messageDate, 'EEEE HH:mm', { locale: zhCN });
    } else {
        return format(messageDate, 'yyyy-MM-dd HH:mm');
    }
}; 