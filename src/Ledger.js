import Dexie from 'dexie';
import { Transaction } from './Transaction';
export class Ledger
{
    initiate()
    {
        this.db = new Dexie("ledger");
        return this.db.version(1).stores({
            // Signature acts as unique ID
            transactions:"signature,version,type,content,for,origin,nonce,timestamp"
        });
    }

    // Returns promise;
    storeTransaction(transaction)
    {
        return this.db.transactions.put(transaction.data);
    }

    storeTransactions(transactions)
    {
        const promise_array = [];
        for(const t of transactions)
            promise_array.push(storeTransaction(t));
        return Promise.all(promise_array);
    }

    async getTransactions()
    {
        const arr = await this.db.transactions.toArray();
        return arr.map(d=>new Transaction(d));
    }


    _saveString(id, value)
    {
        if(!id || !value)
        {
            throw new Error("_storeString: invalid args");
        }
        localStorage.setItem(Ledger._PREFIX+id, value);
    }
    _getString(id)
    {
        if(!id)
        {
            throw new Error("_storeString: invalid args");
        }
        return localStorage.getItem(Ledger._PREFIX+id);
    }

    saveCredentials(data)
    {
        if(!data || !data.id || !data.private_key)
        {
            throw new Error("Can't save credentials - bad args")
        }
        this._saveString("id", data.id);
        this._saveString("private_key", data.private_key);
        this._saveString("public_key", data.public_key);
    }

    getCredentials()
    {
        return {
            id: this._getString("id"),
            private_key: this._getString("private_key"),
            public_key: this._getString("public_key")
        }
    }

    saveEphemeralKeypair(user_id, keypair)
    {
       this._saveString(user_id+"_public_key", keypair.public_key);
       this._saveString(user_id+"_private_key", keypair.private_key);
    }

    getEphemeralKeypair(user_id)
    {
       const pub = this._getString(user_id+"_public_key");
       const priv = this._getString(user_id+"_private_key");
       return {
           "private_key": priv,
           "public_key": pub
       }
    }
}
Ledger._PREFIX = "astrodate-ledger-";

const ledge = new Ledger();
export default ledge;