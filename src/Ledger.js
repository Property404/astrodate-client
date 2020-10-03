import Dexie from 'dexie';
import { Transaction } from './Transaction';
export class Ledger
{
    initiate()
    {
        const db = new Dexie("ledger");
        db.version(1).stores({
            // Signature acts as unique ID
            transactions:"signature,version,type,content,for,origin,nonce,timestamp"
        });
    }

    // Returns promise;
    storeTransaction(transaction)
    {
        return db.transactions.put(transaction.data);
    }

    storeTransactions(transactions)
    {
        const promise_array = [];
        for(const t of transactions)
            promise_array.push(storeTransaction(t));
        return Promise.all(promise_array);
    }

    getTransactions()
    {
        return db.transactions.toArray().map(d=>new Transaction(d));
    }

    saveCredentials(data)
    {
        if(!data || !data.id || !data.private_key)
        {
            throw new Error("Can't save credentials - bad args")
        }
        localStorage.setItem(Ledger._PREFIX + "id", data.id);
        localStorage.setItem(Ledger._PREFIX + "private_key", data.private_key);
    }

    getCredentials()
    {
        return {
            id: localStorage.getItem(Ledger._PREFIX + "id"),
            private_key: localStorage.getItem(Ledger._PREFIX + "private_key")
        }
    }
}
Ledger._PREFIX = "astrodate-ledger-";

const ledge = new Ledger();
export default ledge;