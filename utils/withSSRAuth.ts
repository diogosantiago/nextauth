import { GetServerSideProps, GetServerSidePropsContext, GetServerSidePropsResult } from "next";
import { destroyCookie, parseCookies } from "nookies";
import { AuthTokenError } from "../services/errors/AuthTokenError";
import jwtDecode from "jwt-decode";
import { validateUserPermissions } from "./validateUserPermissions";

type WithSSRAuthOptions = {
  permissions?: string[];
  roles?: string[];
}

export function withSSRAuth<P>(fn: GetServerSideProps<P>, options?: WithSSRAuthOptions): GetServerSideProps {
  return async (ctx: GetServerSidePropsContext): Promise<GetServerSidePropsResult<P>> => {
    const cookies = parseCookies(ctx);
    const token = cookies['nextauth.token']

    if(!token){
      return {
        redirect: {
          destination: '/',
          permanent: false,
        }
      }
    }

    const user = jwtDecode<{permissions: string[]; roles: string[];}>(token);
    if(user && options){
      const { permissions, roles } = options;
      const userHasValidPermissions = validateUserPermissions({
          user, permissions, roles
      });
  
      if(!userHasValidPermissions){
        return {
          redirect: {
            destination: '/dashboard',
            permanent: false,
          }
        }
      }
    }



    try{
      return await fn(ctx);
    } catch (err) {
      console.log('catch');
      if(err instanceof AuthTokenError){
        destroyCookie(ctx, 'nextauth.token');
        destroyCookie(ctx, 'nextauth.refreshToken');

        return {
            redirect: {
                permanent: false,
                destination: '/'
            }
        }
      }
    }
  }
}