import axios from "axios";

const sleep = async(ms: number)=>{
    console.log("first")
    return new Promise<void>(resolve => setTimeout(resolve, ms));
}


function isErrorRetryable(error: unknown){
    //error and response can be safely accessed affter this
    if(!axios.isAxiosError(error)){
        return false;
    }

    console.log("error code:", error.code);

    //error from timeout
    if(error.code === 'ECONNABORTED' || error.code === 'ETIMEDOUT' || error.code === 'ECONNREFUSED'){
        return true;
    }

    //network error
    if(error.code === 'ERR_NETWORK'){
        return true;
    }

    //transient http failure
    const status = error.response?.status;

    return status === 502 || status === 503 || status === 504; 
}

export async function retry<T>(operation: () => Promise<T>, maxAttempts = 3): Promise<T>{
        for(let i=1; i<=maxAttempts; i++){
            console.log("i: ", i);

            try{
                return await operation();
            }
            catch(error){
                const retryable = isErrorRetryable(error);

                if(!retryable){
                    throw error;
                }

                //if this atttempt is the last
                if(i == maxAttempts){
                    throw error;
                };
                const delay = 100 * Math.pow(2, i-1); //100ms, 200ms, 400ms exponential backoff simple

                console.log(
                        `Request failed. Retrying in ${delay}ms..` +
                        `(attempt ${i + 1}/${maxAttempts})`
                );

                await sleep(delay);

            }

    }

    throw new Error("Retry failed unexpectedly");

}
