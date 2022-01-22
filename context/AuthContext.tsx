import Router, { useRouter } from "next/router";
import { destroyCookie, parseCookies, setCookie } from "nookies";
import { createContext, ReactNode, useEffect, useState } from "react";
import { api } from "../services/apiClient";

type User = {
    email: string;
    permissions: string[];
    roles: string[];
}

type SignInCreadentials = {
    email: string;
    password: string;
}

type AuthContextData = {
    signIn: (credentials: SignInCreadentials) => Promise<void>;
    signOut: () => void;
    isAuthenticated: boolean;
    user?: User;
}

type AuthProviderProps = {
    children: ReactNode;
}

export const AuthContext = createContext({} as AuthContextData)

let authChannel: BroadcastChannel;

export function signOut(){
    destroyCookie(undefined, 'nextauth.token');
    destroyCookie(undefined, 'nextauth.refreshToken');
    authChannel.postMessage('signOut');
    Router.push('/')
}


export function AuthProvider({children}: AuthProviderProps){
    const router = useRouter();
    const [user, setUser] = useState<User>();
    const isAuthenticated = !!user;

    useEffect(() => {
        authChannel = new BroadcastChannel('auth');

        authChannel.onmessage = (message) => {
            console.log(message);
            switch(message.data){
                case 'signOut':
                    signOut();
                break;
                // case 'signIn':
                //     Router.push('/dashboard');
                // break;
                default:
                    break;
            }
        }
    }, [])

    useEffect(() => {
        const { 'nextauth.token': token } = parseCookies();
        console.log(token);
        if(token){
            api.get('me').then(response => {
                const { email, permissions, roles} = response.data;
                setUser({
                    email,
                    permissions,
                    roles
                })
            })
            .catch(err => {
                signOut();
            })
        }

    }, []);

    async function signIn({ email, password}: SignInCreadentials){
        try{
            const response = await api.post('sessions', {
                email,
                password
            })

            const { token, refreshToken, permissions, roles} = response.data;

            setCookie(undefined, 'nextauth.token', token, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
            });
            setCookie(undefined, 'nextauth.refreshToken', refreshToken, {
                maxAge: 60 * 60 * 24 * 30, // 30 days
                path: '/'
            });

            setUser({
                email,
                permissions,
                roles
            })
            api.defaults.headers['Authorization'] = `Bearer ${token}`;

            // authChannel.postMessage('signIn');
            router.push('dashboard')
        }
        catch(err) {
            console.log(err);
        }
    }

    return (
        <AuthContext.Provider value={{ isAuthenticated, signIn, user, signOut }}>
            {children}
        </AuthContext.Provider>
    );
}