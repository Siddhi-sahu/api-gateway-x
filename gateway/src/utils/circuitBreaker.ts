export class CircuitBreaker {
    private failures = 0;
    private state: "CLOSED" | "OPEN" | "HALF_OPEN" = "CLOSED";
    private openedAt = 0;

    constructor(
        private failureThreshold = 3,
        private resetTimeout = 10_000
    ){}

    async execute<T>(
        operation: () => Promise<T>
    ){
        //circuit is open
        if(this.state === "OPEN"){
            const elapsed = Date.now() - this.openedAt;

            if(elapsed < this.resetTimeout){
                //fail fast
                throw new Error("CIRCUIT_OPEN");
            }

            //Allow one test request
            this.state = "HALF_OPEN";

            console.log("circuit changed to half open.")
        };

        try{
            const result = await operation();

            //sucesssssssful requesttt
            this.state = "CLOSED"
            this.failures = 0;
            return result;

        }catch(error){
            this.failures++;

            console.log(
                `circuit failure count: ${this.failures}`
            );

            if(this.failures>=this.failureThreshold){
                this.state = "OPEN";
                this.openedAt = Date.now();

                console.log("circuit changed to open.")
            }

            throw error;
        }
    };

    getState(){
        return this.state;
    }
};

export const userServiceCircuitBreaker = new CircuitBreaker(3, 10_000);