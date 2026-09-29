const API_URL = "http://localhost:3000";

export async function getMetrics(){
    const response = await fetch(`${API_URL}/metrics`);

    if(!response.ok){
        throw new Error("Failed to fetch metrics");
    };

    return response.json();
};

export async function getHealth(){
    const response = await fetch(`${API_URL}/health`);
    if (!response.ok) {
        throw new Error("Failed to fetch health");
    };

    console.log(response);
    // console.log(response.json())

    return response.json();
};

export async function getRecentRequests(){
    const response = await fetch(`${API_URL}/recent-requests`);

    if(!response.ok){
        throw new Error("Failed to fetch recent requests.");

    };

    return response.json();
}

export async function getCircuitBreakers(){
    const response = await fetch(`${API_URL}/circuit-breakers`);

    console.log("cs", response);

    if(!response.ok){
        throw new Error("Failed to fetch recent requests.");

    };

    return response.json();
}