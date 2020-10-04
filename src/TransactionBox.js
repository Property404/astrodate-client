import { Relay } from "./Relay";
import constants from "./constants"
import ledger from "./Ledger"
import {Transaction} from "./Transaction"

export class TransactionBox
{
    constructor()
    {
        this._signatures = new Set();
        this._relays = [];
        this._inbox = [];
        this._process_callback = null;
        this.relays.push(new Relay(constants.BOUNCER_SERVER));

    }

    get relays()
    {
        return this._relays;
    }

    sendTransactions(transactions)
    {
        this._inbox.push(...transactions)
        for(const relay of this.relays)
        {
            relay.push(transactions);
        }
    }

    sendTransaction(transaction)
    {
        if(!transaction.isStamped())
            throw new Error("Stamp the dang transaction");
        this.sendTransactions([transaction]);
    }

    receiveTransactions(transactions)
    {
        this._inbox.push(...transactions);
    }

    pollRelays()
    {
        for(const relay of this.relays)
        {
            relay.poll().then( trans=> {
                const trans_array = [];
                for(const t of trans)
                {
                    trans_array.push(new Transaction(t[0]));
                }
                this.receiveTransactions(trans_array);
            });
                
        }
    }

    _process()
    {
        let transaction;
        while(transaction = this._inbox.pop())
        {
            if (transaction.signature == null)
            {
                console.error("Processing null signature");
            }

            if(this._signatures.has(transaction.signature))
                continue;

            this._signatures.add(transaction.signature);

            /*TODO: verify?? */
            if(!transaction.isStamped())
                throw new Exception("Stamp your dang things man");

            this._process_callback(transaction).then(data => {
                if(data)
                    ledger.storeTransaction(data)
            });
        }
    }

    async setProcessCallback(callback, timer=1000)
    {
        const transactions = await ledger.getTransactions();
        this._inbox.push(...transactions)
        this._process_callback = callback;
        setInterval(this.pollRelays.bind(this), timer*2);
        setInterval(this._process.bind(this), timer);
    }
}
const tb = new TransactionBox();
export default tb;