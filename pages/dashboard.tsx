import { useContext, useEffect } from "react";
import { Can } from "../components/Can";
import { AuthContext, signOut } from "../context/AuthContext";
import { setupAPIClient } from "../services/api";
import { api } from "../services/apiClient";
import { withSSRAuth } from "../utils/withSSRAuth";

export default function Dashboard(){
    const {user, signOut} = useContext(AuthContext)

    useEffect(()=> {
        api.get('me').then(response => {
            console.log(response.data);
        }).catch(err => console.log(err))
    }, [])
    return (
        <>
            <h1>dashboard {user?.email}</h1>
            <Can permissions={['metrics.list']} >
                <div>Metricas</div>
            </Can>
            <button onClick={signOut}>deslogar</button>
        </>
    );
}

export const getServerSideProps = withSSRAuth(async (ctx) => {
    const apiClient = setupAPIClient(ctx);
    const response = await apiClient.get('me');
    
    return {
        props: {}
    }
})