import { Relay } from "./Relay";
import constants from "./constants"
import ledger from "./ledger;"

export class TransactionBox
{
    constructor()
    {
        this._signatures = new Set();
        this._relays = [];
        this._inbox = [];
        this._process_callback = null;
        this.relays.push(new Relay(constants.BOUNCER_SERVER));

        this._inbox.push(...ledger.getTransactions())
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
        this.sendTransactions([transaction]);
    }

    receiveTransactions(transactions)
    {
        this._inbox.push(...transaction);
    }

    _process()
    {
        let transaction;
        while(transaction = this._inbox.pop())
        {
            if (transaction.signature == null)
                console.error("Processing null signature")

            if(this._signatures.includes(transaction.signature))
                continue;

            this._signatures.add(transaction.signature);

            /*TODO: verify?? */

            ledger.storeTransaction(transaction);

            this._process_callback(transaction);
        }
    }

    setProcessCallback(callback, timer=1000)
    {
        this._process_callback = callback;
        setTimeout(this._process.bind(this), timer);
    }
}
const tb = new TransactionBox();
export default tb;