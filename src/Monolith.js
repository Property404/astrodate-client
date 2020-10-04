/* 
    Yes, this is a god object.
    It's a hackathon and I'm delirious

    Leave me alone
*/

import {Transaction} from "./Transaction";
import tb from "./TransactionBox";
import constants from "./constants";
import ledger from "./Ledger";

class Message
{
    constructor(transaction, pubkey)
    {
        this.timestamp = transaction.timestamp;
        this.origin = transaction.origin;
        this.for = transaction.for;
        const private_key = ledger.getEphemeralKeypair(transaction.for).private_key;
        this.content = cw.decrypt(transaction.content, transaction.nonce, pubkey, private_key);
    }
}
class User
{
    constructor()
    {
        this.available_properties = ["id", "public_key", "blurb",
        "ephemeral_key", "liked", "likes_back",
        "picture", "gender", "age","location","name"];
    }

    update(prop, tkey, transaction)
    {
        if(!(this.available_properties.includes(prop)))
        {
            throw new Error("Not a valid property")
        }
        const preprop = prop;
        prop = "_"+prop;
        if(!(transaction instanceof Transaction))
            throw new Error("transaction not Transaction")
        if(prop == null || tkey == null)
            throw new Error("bad args to ::update");
        if(typeof tkey !== "string")
            throw new Error("tkey should be string(so should prop)");

        if(!(this[prop]) || this[prop].timestamp < transaction.timestamp)
        {
            this[prop] = {
                "value": transaction[tkey],
                "timestamp": transaction["timestamp"]
            }
            this[preprop] = transaction[tkey];
        }
    }

    data()
    {
        const d = {};
        for(const prop of this.available_properties)
        {
            d[prop] = this[prop];
        }
        d["messages"] = this["messages"];
    }


}
class Monolith
{
    constructor()
    {
        this.users = {};
        const self = new User();
        const cred = ledger.getCredentials();
        self.id = cred.id;
        self.public_key = cred.public_key;
        this.users[self.id] = self;

        // These need to be pushed back to TransactionBox, eventually
        this.unconfirmed_transactions = [];
    }

    initiate()
    {
        tb.setProcessCallback(this._process.bind(this));
    }

    async _process(transaction)
    {
        console.log(this.users);
        if(transaction.type === Transaction.TRANSACTION_TYPE_NEW_PUBKEY)
        {
            // Eek! New User
            // Let's first confirm this is legit though
            if(!transaction.verify(constants.BOUNCER_PUBKEY))
            {
                console.error("Invalid new_public_key transaction")
                return null;
            }
            const id = transaction["for"];
            this.users[id] = new User();
            const user =this.users[id];
            user.update("id", "for", transaction);
            user.update("public_key", "content", transaction);
        }
        else
        {
            // User transaction - confirm validity
            const id = transaction.origin;
            const user = this.users[id];
            if(!id || !user || !transaction.verify(user.public_key))
            {
                console.log("Unconfirmed user transaction, pushing back");
                this.unconfirmed_transactions.push(transaction);
                return null;
            }

            if(transaction.type === Transaction.TRANSACTION_TYPE_UPDATE_BIO)
            {
                if(["gender","age","location","name","blurb".includes(transaction.for)])
                {
                    user.update(transaction.for, "content", transaction);
                }
                else
                {
                    console.error("Unknown update_bio suptype: "+transaction.for);
                    return null;
                }
            }
            else if(transaction.origin == this.credentials.id)
            {
                // Something WE created
                // Our baby
                // Our precious precious baby

                const obj_of_affection = this.users[transaction.for];
                if (!obj_of_affection) {
                    console.log("Unconfirmed message from us, pushing back");
                    this.unconfirmed_transactions.push(transaction);
                    return null;
                }

                if(transaction.type === Transaction.TRANSACTION_TYPE_LIKE)
                {
                    obj_of_affection.update("liked", "nonce", transaction);
                }
                else if(transaction.type === Transaction.TRANSACTION_TYPE_MESSAGE)
                {
                    user.messages.push(new Message(transaction, obj_of_affection.public_key));
                }
                else
                {
                    console.error("Unknown type "+ transaction.type);
                    return null;
                }
            }
            else
            {
                // Discard if not for us
                const dest = transaction.for;
                if(dest != this.credentials.id)
                {
                    console.log("Not for us...discarding")
                    return null
                }
                
                if (transaction.type === Transaction.TRANSACTION_TYPE_LIKE)
                {
                    // recieve ephemeral public key
                    user.update("ephemeral_key", "content", transaction);
                    user.update("likes_back", "nonce", transaction);
                }
                else if(transaction.type === Transaction.TRANSACTION_TYPE_MESSAGE)
                {
                    user.messages.push(new Message(transaction, obj_of_affection.public_key));
                }
                else
                {
                    console.error("Unknown type "+ transaction.type);
                    return null;
                }
            }
        }
        return transaction;
    }
}

const mono = new Monolith();
export default  mono;