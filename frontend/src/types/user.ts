export interface User {
    id: number;
    username: string;
}

export interface LoginResponse {
    access_token: string;
    token_type: string;
}