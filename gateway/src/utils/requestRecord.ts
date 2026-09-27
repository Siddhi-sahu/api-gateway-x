export interface RequestRecord {
    requestId: string;
    method: string;
    route: string;
    statusCode: number;
    durationMs: number;
    timestamp: string;
};

const recentRequests: RequestRecord[] = [];

export function addRequest(record: RequestRecord){
    recentRequests.unshift(record);

    if(recentRequests.length > 20){
        recentRequests.pop();
    }
};

export function getRecentRequests(){
    return recentRequests;
}