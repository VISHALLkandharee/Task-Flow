export interface RegisterInput {
    name: string;
    email: string;
    password: string;
    workspaceName: string;
}

export interface LoginInput {
    email: string;
    password: string;
}


export interface JwtPayload {
   userId: string;
   email: string;
   iat?: number;
   exp?: number;
}