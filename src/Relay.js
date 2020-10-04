import {Transaction} from "./Transaction";

function assert(condition)
{
    if(!condition)
    {
        throw new Error("Assertion failed");
    }
}
export class Relay
{
    _getApiUrl(meth)
    {
        return this.server + "/api/relay/" + meth;
    }

    // Server should include protocol and port
    constructor(server)
    {
        this.server = server;
        this.since = 0;
    }

    async poll()
    {
        const url = this._getApiUrl("poll?since="+this.since);
        const raw_response = await fetch(url,{method: "GET"});
        const response = await raw_response.json();
        if(response.error || response.since === null || response.since === undefined)
        {
            throw new Error("Received error from polling server")
        }
        this.since = response.since;

        return response.transactions;
    }

    async push(transactions)
    {
        assert(transactions[0] instanceof Transaction);
        const just_data = [];
        for(const t of transactions)
            just_data.push(t.data);
        
        const url = this._getApiUrl("push");

        const raw_response = await fetch(url, {
            method: "POST",
            headers: {
                "Accept": "application/json",
                "Content-Type": "application/json"
            },
            body: JSON.stringify(just_data)});
        const response = raw_response.json();
        return response;
    }
}