import axios from "axios";

const USER_SERVICE_URL = process.env.USER_SERVICE_URL;

if (!USER_SERVICE_URL) {
    throw new Error("USER_SERVICE_URL is not defined");
};

export async function getUserService(){
    try{
        console.log("hit")
        const response = await axios.get(USER_SERVICE_URL!);
        console.log(response.data);
        return response.data;
    }catch(e){
        console.log(e);
    } 
}